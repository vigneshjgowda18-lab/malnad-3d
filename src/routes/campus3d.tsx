import { createFileRoute } from "@tanstack/react-router";
import { CampusViewer } from "@/components/campus3d/CampusViewer";

export const Route = createFileRoute("/campus3d")(  {
  component: Campus3DPage,
  head: () => ({
    meta: [
      { title: "3D Campus Viewer · CampusOS" },
      {
        name: "description",
        content:
          "Interactive 3D campus viewer built with Gen-Map — explore buildings, roads and terrain in full 3D.",
      },
      { property: "og:title", content: "3D Campus Viewer · CampusOS" },
      {
        property: "og:description",
        content: "Explore the campus in an interactive 3D viewer powered by Three.js.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Campus3DPage() {
  return <CampusViewer />;
}
