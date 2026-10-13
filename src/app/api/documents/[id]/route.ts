import { NextResponse } from "next/server";
import { getSession, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id }, include: { saleCase: true } });
  if (!doc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (!isStaff(session.role)) {
    if (!doc.saleCase || doc.saleCase.clientId !== session.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    if (doc.visibility === "INTERNE") {
      return NextResponse.json({ error: "Document interne" }, { status: 403 });
    }
  }
  const buf = Buffer.from(doc.content, "base64");
  return new NextResponse(buf, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.filename}"`,
    },
  });
}
