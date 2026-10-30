import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { MatchProvider } from "./features/MatchContext";
import { GuidedPage } from "./pages/GuidedPage";
import { HomePage } from "./pages/HomePage";
import { ResultsPage } from "./pages/ResultsPage";
import { ComparePage } from "./pages/ComparePage";
import { CardDetailsPage } from "./pages/CardDetailsPage";
import { AboutPage } from "./pages/AboutPage";
import { AiRecommendPage } from "./pages/AiRecommendPage";

export default function App() {
  return (
    <BrowserRouter>
      <MatchProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/guided" element={<GuidedPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/cards/:cardId" element={<CardDetailsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/ai" element={<AiRecommendPage />} />
            <Route
              path="*"
              element={
                <section className="page-width content-page">
                  <h1>Let’s find your match.</h1>
                  <Link className="button" to="/guided">
                    Start guided search
                  </Link>
                </section>
              }
            />
          </Route>
        </Routes>
      </MatchProvider>
    </BrowserRouter>
  );
}
