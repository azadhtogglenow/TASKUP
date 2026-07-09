import type { Request, Response } from "express";
import { documentModel } from "../models/documentModel";
import { documentSchema } from "../schemas/documentSchema";

export const createDocument = (req: Request, res: Response): void => {
  const result = documentSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Validation Failed",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  const document = documentModel.create(result.data);

  res.status(201).json({
    message: "Document uploaded successfully",
    data: document,
  });
};

export const getAllDocuments = (req: Request, res: Response): void => {
  const documents = documentModel.getAll();
  res.json(documents);
};

// Get Document By ID
export const getDocumentById = (req: Request, res: Response): void => {
  const id = Number(req.params.id);

  const document = documentModel.getById(id);

  if (!document) {
    res.status(404).json({
      message: "Document not found",
    });
    return;
  }

  res.json(document);
};

// Update Document
export const updateDocument = (req: Request, res: Response): void => {
  const id = Number(req.params.id);

  if (!documentModel.exists(id)) {
    res.status(404).json({
      message: "Document not found",
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
export const deleteDocument = (req: Request, res: Response): void => {
  const id = Number(req.params.id);

  if (!documentModel.exists(id)) {
    res.status(404).json({
      message: "Document not found",
    });
    return;
  }

  documentModel.delete(id);

  res.json({
    message: "Document deleted successfully",
  });
};