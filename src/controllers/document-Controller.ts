import type { Request, Response } from "express";
import { z } from "zod";
import { documentSchema } from "../schemas/document-Schema";
import { documentModel } from "../models/document-Model";
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
  res.json({message:"All documents retrieved successfully", data: documents});
};

export const getDocumentById = (req: Request, res: Response): void => {
  const parsedID = z.coerce.number().int().safeParse(req.params.id);

  if(!parsedID.success){
     res.status(400).json({message: 'id must be a positive integer' });
     return;
  }
  const id = parsedID.data;

  const document = documentModel.getById(id);

  if (!document) {
    res.status(404).json({
      message: "Document not found",
    });
    return;
  }

  res.json(document);
};

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

export const deleteDocument = (req: Request, res: Response): void => {
  const parsedID = z.coerce.number().int().safeParse(req.params.id);

  if(!parsedID.success){
     res.status(400).json({message: 'id must be a positive integer' });
     return;
  }
  const id = parsedID.data;

  if (!documentModel.exists(id)) {
    res.status(404).json({
      message: "Document not found",
    });
    return;
  }

  documentModel.delete(id);

  res.send(204).send();
};