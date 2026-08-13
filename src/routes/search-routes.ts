import { Router } from "express";
import { SearchController } from "../controllers/search.controller.js";

const searchRouter = Router();

searchRouter.post("/search", SearchController.search);

export default searchRouter;
