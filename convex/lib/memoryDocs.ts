// Ids of the documents Shots keeps in a user's memory namespace.
// A screenshot's document id is the screenshot id. Each question adds two chat documents.
export const chatDocId = (questionId: string, role: "user" | "assistant") => `chat_${questionId}_${role}`;
export const chatDocIds = (questionId: string) => [chatDocId(questionId, "user"), chatDocId(questionId, "assistant")];
