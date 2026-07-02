export interface EvaluateRequest {
  pdf_source: string;
  rubrics: string;
  subject: string;
  total_marks: number;
}

export interface EvaluateResponse {
  success: boolean;
  ocr_text: string;
  evaluation: string;
  error?: string;
}
