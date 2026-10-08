import * as React from "react";
import { StepBuilder } from "@/components/follow-ups/StepBuilder";

interface SequenceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SequenceDetailPage({
  params,
}: SequenceDetailPageProps) {
  const { id } = await params;
  return <StepBuilder sequenceId={id} />;
}
