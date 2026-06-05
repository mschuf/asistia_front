import { apiClient } from "@/api/apiClient";

export interface SendMailPayload {
  email: string;
  description: string;
  categoryId: number;
  type?: "incident" | "request";
}

export interface SendMailRequester {
  userId: number | null;
  name: string;
  email: string;
  source: "glpi" | "ldap";
}

export interface SendMailCategory {
  id: number;
  name: string;
}

export interface SendMailResult {
  ticketId: number;
  subject: string;
  type: "incident" | "request";
  sent: boolean;
  error: string | null;
  requester: SendMailRequester;
  category: SendMailCategory;
  mail: {
    sent: boolean;
    error: string | null;
  };
  warnings: string[];
  userMailSent: boolean;
  supportMailSent: boolean;
}

export interface MailTestCategory {
  id: number;
  name: string;
  fullPath: string;
  parentId: number | null;
  level: number;
}

export async function listMailTestCategories(): Promise<MailTestCategory[]> {
  return apiClient.get<MailTestCategory[]>("/mail/categories", { auth: false });
}

export async function sendMailRequest(payload: SendMailPayload): Promise<void> {
  await apiClient.post<void>("/mail/send", payload, { auth: false });
}

