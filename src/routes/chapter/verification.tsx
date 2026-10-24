import { VerificationTeamPanel } from "@/components/team/VerificationTeamPanel";
import { ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { useChapterRole } from "@/components/chapter/ChapterGuard";
import { canWriteChapterModule } from "@/lib/chapterRoles";

export default function ChapterVerificationPage() {
  const role = useChapterRole();
  const canWrite = canWriteChapterModule(role, "verification");

  return (
    <div>
      <ChapterPageHeader
        title="Team Verification"
        description="Chapter verification sheet — same columns as the CEO team form, scoped to your chapter."
      />
      <VerificationTeamPanel canWrite={canWrite} />
    </div>
  );
}
