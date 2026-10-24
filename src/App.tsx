import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./routes/index";
import About from "./routes/about";
import Mission from "./routes/mission";
import Leadership from "./routes/leadership";
import Chapters from "./routes/chapters";
import Events from "./routes/events";
import Gallery from "./routes/gallery";
import Volunteer from "./routes/volunteer";
import Contact from "./routes/contact";
import Donate from "./routes/donate";
import Login from "./routes/login";
import Register from "./routes/register";
import ForgotPassword from "./routes/forgot-password";
import ResetPassword from "./routes/reset-password";
import Faq from "./routes/faq";
import { ChapterShell } from "./components/chapter/ChapterShell";
import { ChapterModule } from "./components/chapter/ChapterGuard";
import ChapterOverviewPage from "./routes/chapter/overview";
import ChapterVerificationPage from "./routes/chapter/verification";
import ChapterOperationsPage from "./routes/chapter/operations";
import ChapterFinancePage from "./routes/chapter/finance";
import ChapterDocumentationPage from "./routes/chapter/documentation";
import ChapterCaseRegistrationsPage from "./routes/chapter/case-registrations";
import ChapterMediaPage from "./routes/chapter/media";
import ChapterMediaCasesPage from "./routes/chapter/media-cases";
import ChapterTeamPage from "./routes/chapter/team";
import ChapterMembersPage from "./routes/chapter/members";
import ChapterNotificationsPage from "./routes/chapter/notifications";
import ChapterProfilePage from "./routes/chapter/profile";
import ChapterSettingsPage from "./routes/chapter/settings";
import ChapterReportsPage from "./routes/chapter/reports";
import MyDonationPage from "./routes/chapter/my-donation";
import TeamCollectionPage from "./routes/chapter/team-collection";
import DirectorDonationsPage from "./routes/chapter/director-donations";
import ChapterEventsPage from "./routes/chapter/events";
import ChapterContactItPage from "./routes/chapter/contact-it";
import { useAuth } from "./lib/auth";
import { isPlainMember, resolveChapterRole } from "./lib/chapterRoles";
function ChapterHomeGate() {
  const { user } = useAuth();
  const role = resolveChapterRole(user ?? {});
  if (isPlainMember(role)) return <Navigate to="/chapter/my-donation" replace />;
  return <ChapterOverviewPage />;
}
function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/mission" element={<Mission />} />
      <Route path="/team" element={<Leadership />} />
      <Route path="/leadership" element={<Navigate to="/team" replace />} />
      <Route path="/chapters" element={<Chapters />} />
      <Route path="/programs" element={<Navigate to="/about#programs" replace />} />
      <Route path="/events" element={<Events />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/volunteer" element={<Volunteer />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/donate" element={<Donate />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/faq" element={<Faq />} />

      <Route path="/chapter" element={<ChapterShell />}>
        <Route index element={<ChapterHomeGate />} />
        <Route
          path="my-donation"
          element={
            <ChapterModule module="my-donation">
              <MyDonationPage />
            </ChapterModule>
          }
        />
        <Route
          path="team-collection"
          element={
            <ChapterModule module="team-collection">
              <TeamCollectionPage />
            </ChapterModule>
          }
        />
        <Route
          path="director-donations"
          element={
            <ChapterModule module="director-donations">
              <DirectorDonationsPage />
            </ChapterModule>
          }
        />
        <Route
          path="verification"
          element={
            <ChapterModule module="verification">
              <ChapterVerificationPage />
            </ChapterModule>
          }
        />
        <Route
          path="operations"
          element={
            <ChapterModule module="operations">
              <ChapterOperationsPage />
            </ChapterModule>
          }
        />
        <Route
          path="media-cases"
          element={
            <ChapterModule module="media">
              <ChapterMediaCasesPage />
            </ChapterModule>
          }
        />
        <Route
          path="finance"
          element={
            <ChapterModule module="finance">
              <ChapterFinancePage />
            </ChapterModule>
          }
        />
        <Route
          path="documentation"
          element={
            <ChapterModule module="documentation">
              <ChapterDocumentationPage />
            </ChapterModule>
          }
        />
        <Route
          path="case-registrations"
          element={
            <ChapterModule module="case-registrations">
              <ChapterCaseRegistrationsPage />
            </ChapterModule>
          }
        />
        <Route
          path="media"
          element={
            <ChapterModule module="media">
              <ChapterMediaPage />
            </ChapterModule>
          }
        />
        <Route
          path="team"
          element={
            <ChapterModule module="team">
              <ChapterTeamPage />
            </ChapterModule>
          }
        />
        <Route
          path="events"
          element={
            <ChapterModule module="events">
              <ChapterEventsPage />
            </ChapterModule>
          }
        />
        <Route
          path="notifications"
          element={
            <ChapterModule module="notifications">
              <ChapterNotificationsPage />
            </ChapterModule>
          }
        />
        <Route
          path="contact-it"
          element={
            <ChapterModule module="contact-it">
              <ChapterContactItPage />
            </ChapterModule>
          }
        />
        <Route
          path="members"
          element={
            <ChapterModule module="members">
              <ChapterMembersPage />
            </ChapterModule>
          }
        />
        <Route path="profile" element={<ChapterProfilePage />} />
        <Route path="settings" element={<ChapterSettingsPage />} />
        <Route
          path="reports"
          element={
            <ChapterModule module="reports">
              <ChapterReportsPage />
            </ChapterModule>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
