"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDropzone } from "@uploadthing/react";
import { useCallback, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePDFJS } from "./usePDFJS";
import * as mammoth from "mammoth";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { removeDocumentsField, updateDocumentsField } from "@/server/actions/sources/mutations";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";

const PROFILE_MAX_SIZE = 4; // Max file size in MB
const ACCEPTED_FILE_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/json"
];

// Helper function to clean text
const cleanText = (text: string): string => {
    // Normalize whitespace: replace multiple spaces, tabs, and newlines with a single space
    text = text.replace(/\s+/g, ' ').trim();

    // Remove zero-width space characters
    text = text.replace(/[\u{200B}-\u{200D}\u{FEFF}]/gu, '');

    // Remove non-printable characters (non-ASCII)
    text = text.replace(/[^\x20-\x7E]/g, '');

    // Remove excessive punctuation: replace sequences of punctuation with a single instance
    text = text.replace(/([!,.?])\1+/g, '$1');

    // Remove trailing punctuation if text ends with it
    text = text.replace(/[!,.?]+$/, '');

    // Normalize quotation marks: replace smart quotes with standard quotes
    text = text.replace(/[“”‘’]/g, '"');

    // Remove extra spaces around quotes
    text = text.replace(/\s*"\s*/g, '"');

    // Remove repeated words (case-insensitive)
    text = text.replace(/\b(\w+)\s+\1\b/gi, '$1');

    // Remove empty lines and ensure single line breaks between paragraphs
    text = text.replace(/\n{2,}/g, '\n\n');

    // Optionally, ensure proper capitalization (e.g., capitalize the first letter of each sentence)
    text = text.replace(/(?:^|\.\s+)([a-z])/g, (match, p1) => p1.toUpperCase());

    // Optionally, replace common typos or informal language with standardized terms
    // Example: text = text.replace(/\bteh\b/g, 'the'); // Replace 'teh' with 'the'

    // Remove any remaining leading or trailing spaces
    text = text.trim();

    return text;
};


const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(cleanText(reader.result as string));
        };

        reader.onerror = () => {
            reject(reader.error);
        };

        reader.readAsText(file);
    });
};

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result as ArrayBuffer);
        };

        reader.onerror = () => {
            reject(reader.error);
        };

        reader.readAsArrayBuffer(file);
    });
};

const parseCSV = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: false,
            complete: (result) => {
                const text = result.data.map((row: any) => row.join(',')).join('\n');
                resolve(cleanText(text));
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};

const parseXLSX = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            let text = '';
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                text += XLSX.utils.sheet_to_csv(sheet);
            });
            resolve(cleanText(text));
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
};

const parseJSON = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const json = JSON.parse(reader.result as string);
                resolve(cleanText(JSON.stringify(json, null, 2)));
            } catch (error) {
                reject("Invalid JSON file.");
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsText(file);
    });
};


export function FileUploadForm({ source, subscription, stats, onSourceChange }: { source: any, subscription: any, stats: any, onSourceChange: (newSource: any) => void }) {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [convertedData, setConvertedData] = useState<Map<string, string>>(source?.documents ? new Map(Object.entries(source.documents)) : new Map());
    const pdfjs = usePDFJS();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);

    const {
        textInputChars,
        linkChars,
        totalChars,
        linkCount,
        qaChars,
        qaCount,
        fileChars,
        fileCount,
        trainChatbot,
        lastTrainedDate
    } = stats;
    const processFile = useCallback(async (file: File) => {
        try {
            let text = '';

            if (file.type === "application/pdf") {
                if (!pdfjs) {
                    toast.error("PDF.js is not loaded yet");
                    return;
                }

                const arrayBuffer = await readFileAsArrayBuffer(file);
                const pdfData = new Uint8Array(arrayBuffer);

                const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
                const numPages = pdf.numPages;

                for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                    try {
                        const page = await pdf.getPage(pageNum);
                        const content = await page.getTextContent();
                        text += content.items.map((item: any) => item.str).join(' ');

                        setUploadProgress(Math.round((pageNum / numPages) * 100));
                    } catch (error) {
                        console.error(`Error processing page ${pageNum}:`, error);
                    }
                }
            } else if (file.type === "text/plain") {
                text = await readFileAsText(file);
            } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                const arrayBuffer = await readFileAsArrayBuffer(file);
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = cleanText(result.value);
            } else if (file.type === "text/csv") {
                text = await parseCSV(file);
            } else if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                text = await parseXLSX(file);
            } else if (file.type === "application/json") {
                text = await parseJSON(file);
            } else if (file.type === "application/msword") {
                toast.error("Processing of .doc files is not yet supported.");
                return;
            } else {
                toast.error("Unsupported file type.");
                return;
            }
            const newTotalChars = totalChars + text.length;

            if (newTotalChars > subscription?.charactersPerChatbot) {
                toast.error(`File exceeds the character limit for your subscription. Current total: ${totalChars}, New file: ${text.length}, Limit: ${subscription?.charactersPerChatbot}`);
                return;
            }

            setConvertedData((prevData) => {
                const newData = new Map(prevData);
                newData.set(file.name, text);
                return newData;
            });
            // Convert the updated Map to a plain object for the API call
            const documentsUpdate: Record<string, string> = Object.fromEntries(
                Array.from(new Map(convertedData).set(file.name, text))
            );
            onSourceChange({
                ...source,
                documents: documentsUpdate
            });
            // Update the documents field in the database
            await updateDocumentsField(documentsUpdate);
            toast.success(`Document processed successfully (${text.length || 0} chars)`);
        } catch (error) {
            console.error("Error processing document:", error);
            toast.error("Document could not be processed: " + (error as Error).message);
            setUploadProgress(0);
        } finally {
            setUploadProgress(0);
        }
    }, [pdfjs]);
    const confirmRemoveFile = async () => {
        if (fileToDelete) {
            try {
                // Remove the file from the state
                setFiles(prevFiles => prevFiles.filter(file => file.name !== fileToDelete));
                setConvertedData(prevData => {
                    const newConvertedData = new Map(prevData);
                    newConvertedData.delete(fileToDelete);
                    return newConvertedData;
                });

                // Create a Set of filenames to remove
                const documentNamesToRemove = new Set([fileToDelete]);

                // Call the API to remove the documents
                removeDocumentsField(documentNamesToRemove);

                toast.success(`File "${fileToDelete}" removed successfully.`);
            } catch (error) {
                console.error("Error removing file:", error);
                toast.error(`Failed to remove file "${fileToDelete}": ${(error as Error).message}`);
                setIsDialogOpen(false);
                setFileToDelete(null);
            }
        }
        setIsDialogOpen(false);
        setFileToDelete(null);
    };

    const cancelRemoveFile = () => {
        setIsDialogOpen(false);
        setFileToDelete(null);
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
        for (const file of acceptedFiles) {
            await processFile(file);
        }
    }, [processFile]);

    const { getRootProps, getInputProps, isDragActive, isDragAccept } =
        useDropzone({
            onDrop,
            accept: ACCEPTED_FILE_TYPES,
            maxSize: PROFILE_MAX_SIZE * 1024 * 1024,
        });

    const handleRemoveFile = async (fileName: string) => {
        setFileToDelete(fileName);
        setIsDialogOpen(true);
    };


    return (
        <>
            <Card>
                <CardContent className="flex items-center gap-4">
                    <div className="p-6 rounded-lg w-full max-w-lg">
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold">Upload and Convert Documents</h2>
                            <p className="text-sm text-muted-foreground">
                                Drag and drop files here, or click to select files. Supported file types: .pdf, .docx, .txt, .csv, .xlsx, .json
                            </p>
                        </div>

                        <div
                            {...getRootProps()}
                            className={cn(
                                "flex h-36 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border transition-[border] hover:border-primary",
                                isDragActive && "border-primary",
                                isDragAccept && "border-green-500"
                            )}
                        >
                            <input {...getInputProps()} />

                            <p className="p-8 text-center text-sm text-muted-foreground">
                                {isDragActive
                                    ? isDragAccept
                                        ? "Drop the files here"
                                        : "These file types are not supported"
                                    : "Drag and drop files here, or click to select files not more than 4MB in size."}
                            </p>
                        </div>

                        <div className="mt-7">
                            <div className="relative flex items-center justify-center">
                                <span className="relative px-2 text-sm text-muted-foreground bg-transparent">Attached Files</span>
                            </div>

                            {convertedData && convertedData.size > 0 ? (
                                <ul className="list-disc pl-5">
                                    {Array.from(convertedData.entries()).map(([fileName, textData]) => (
                                        <li key={fileName} className="flex justify-between items-center py-2">
                                            <span className="text-sm">{fileName} {textData ? '(' + textData.length + ' chars)' : ''}</span>
                                            <Button
                                                onClick={() => handleRemoveFile(fileName)}
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="flex-shrink-0"
                                            >
                                                <Trash2Icon className="h-4 w-4" />
                                            </Button>

                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No files processed</p>
                            )}

                        </div>

                        {uploadProgress > 0 && (
                            <div className="mt-4">
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                        <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-green-700 bg-green-200">
                                            Upload Progress
                                        </div>
                                        <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-green-700 bg-green-200">
                                            {uploadProgress}%
                                        </div>
                                    </div>
                                    <div className="relative flex items-center justify-between">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-green-500 h-2.5 rounded-full transition-all duration-200"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        )}
                    </div>
                </CardContent>
            </Card>
            {/* Confirmation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        Are you sure you want to delete the file "{fileToDelete}"? This action cannot be undone.
                    </DialogDescription>
                    <DialogFooter>
                        <Button type="button" onClick={cancelRemoveFile} variant="outline">
                            Cancel
                        </Button>
                        <Button type="button" onClick={confirmRemoveFile} variant="destructive">
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
