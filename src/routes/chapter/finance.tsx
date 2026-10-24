import { FinanceCasePage } from "@/components/finance/FinanceCasePage";
import {
  FinanceDonationPage,
  type ChapterScope,
} from "@/components/finance/FinanceDonationPage";
import { ChapterCard } from "@/components/chapter/ChapterPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { chapterIdFromUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function chapterScopeFromUser(user: ReturnType<typeof useAuth>["user"]): ChapterScope | null {
  const chapterId = chapterIdFromUser(user);
  if (!chapterId) return null;
  const chapterName =
    user?.chapter && typeof user.chapter === "object" && user.chapter.name
      ? user.chapter.name
      : "Chapter";
  return { chapterId, chapterName };
}

export default function ChapterFinancePage() {
  const { user } = useAuth();
  const scope = chapterScopeFromUser(user);

  if (!scope) {
    return (
      <ChapterCard>
        <p className="text-sm text-muted-foreground">
          Your account is not linked to a chapter. Contact an administrator to assign your chapter
          before using finance files.
        </p>
      </ChapterCard>
    );
  }

  return (
    <Tabs defaultValue="donations" className="gap-6">
      <TabsList>
        <TabsTrigger value="donations">Monthly donations</TabsTrigger>
        <TabsTrigger value="cases">Case files</TabsTrigger>
      </TabsList>
      <TabsContent value="donations">
        <FinanceDonationPage scope={scope} />
      </TabsContent>
      <TabsContent value="cases">
        <FinanceCasePage scope={scope} />
      </TabsContent>
    </Tabs>
  );
}
