import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
  schemaPath: string;
  params?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

let cachedSchema: object | null = null;

export async function loadComplianceSchema(): Promise<object> {
  if (cachedSchema) return cachedSchema;
  
  const response = await fetch("/schemas/compliance-report.schema.json");
  if (!response.ok) {
    throw new Error("Failed to load compliance report schema");
  }
  cachedSchema = await response.json();
  return cachedSchema!;
}

export async function validateComplianceReport(data: unknown): Promise<ValidationResult> {
  try {
    const schema = await loadComplianceSchema();
    const validate = ajv.compile(schema);
    const valid = validate(data);
    
    if (valid) {
      return { valid: true, errors: [] };
    }
    
    const errors: ValidationError[] = validate.errors?.map((err) => ({
      path: err.instancePath || "(root)",
      message: err.message || "Unknown error",
      keyword: err.keyword,
      schemaPath: err.schemaPath,
      params: err.params as Record<string, unknown>,
    })) || [{ 
      path: "(root)", 
      message: "Unknown validation error", 
      keyword: "unknown",
      schemaPath: "#"
    }];
    
    return { valid: false, errors };
  } catch (error) {
    return {
      valid: false,
      errors: [{
        path: "(root)",
        message: error instanceof Error ? error.message : "Schema validation failed",
        keyword: "error",
        schemaPath: "#",
      }],
    };
  }
}

// Helper to format error for display
export function formatValidationError(error: ValidationError): string {
  const pathDisplay = error.path === "(root)" ? "Root" : error.path;
  return `${pathDisplay}: ${error.message}`;
}

// Helper to get detailed error info
export function getDetailedErrorInfo(error: ValidationError): string {
  const parts = [
    `Path: ${error.path}`,
    `Error: ${error.message}`,
    `Rule: ${error.keyword}`,
    `Schema: ${error.schemaPath}`,
  ];
  
  if (error.params && Object.keys(error.params).length > 0) {
    parts.push(`Details: ${JSON.stringify(error.params)}`);
  }
  
  return parts.join("\n");
}
