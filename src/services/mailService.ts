import { apiClient } from "@/api/apiClient";

export interface SendMailPayload {
  email: string;
  description: string;
  categoryId: number;
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
  sent: boolean;
  error: string | null;
  requester: SendMailRequester;
  category: SendMailCategory;
  userMailSent: boolean;
  supportMailSent: boolean;
}

export async function sendMailRequest(payload: SendMailPayload): Promise<SendMailResult> {
  return apiClient.post<SendMailResult>("/mail/send", payload, { auth: false });
}
