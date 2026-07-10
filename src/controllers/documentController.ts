import { Request, Response } from "express";
import { documentModel } from "../models/documentModel";
import { documentSchema } from "../schemas/documentSchema";

// Create Document (Authenticated users only)
export const createDocument = (req: Request, res: Response): void => {
  const result = documentSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Validation Failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  // Assign document to logged-in user
  const document = documentModel.create(result.data, req.user!.userId);

  res.status(201).json({
    message: "Document created successfully",
    data: document,
  });
};

// Get All Documents
// - Admin: sees all documents
// - User: sees only their documents
export const getAllDocuments = (req: Request, res: Response): void => {
  const documents = documentModel.getAll(req.user!.userId, req.user!.role);
  res.json(documents);
};

// Get Document By ID
// - Admin: can access any document
// - User: can only access their own document
export const getDocumentById = (req: Request, res: Response): void => {
  const id = Number(req.params.id);
  const document = documentModel.getById(id);

  if (!document) {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  // Ownership check (admin bypasses)
  if (req.user!.role !== "admin" && document.userId !== req.user!.userId) {
    res.status(403).json({
      message: "Access denied. You do not own this document.",
    });
    return;
  }

  res.json(document);
};

// Update Document
// - Admin: can update any document
// - User: can only update their own document
export const updateDocument = (req: Request, res: Response): void => {
  const id = Number(req.params.id);

  if (!documentModel.exists(id)) {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  // Ownership check (admin bypasses)
  if (req.user!.role !== "admin" && !documentModel.isOwner(id, req.user!.userId)) {
    res.status(403).json({
      message: "Access denied. You do not own this document.",
    });
    return;
  }

  const result = documentSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Validation Failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  const document = documentModel.update(id, result.data);

  res.json({
    message: "Document updated successfully",
    data: document,
  });
};

// Delete Document
// - Admin: can delete any document
// - User: can only delete their own document
export const deleteDocument = (req: Request, res: Response): void => {
  const id = Number(req.params.id);

  if (!documentModel.exists(id)) {
    res.status(404).json({ message: "Document not found" });
    return;
  }

  // Ownership check (admin bypasses)
  if (req.user!.role !== "admin" && !documentModel.isOwner(id, req.user!.userId)) {
    res.status(403).json({
      message: "Access denied. You do not own this document.",
    });
    return;
  }

  documentModel.delete(id);

  res.json({
    message: "Document deleted successfully",
  });
};