import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Callback from "@/pages/Callback";
import GenreExplorer from "@/pages/GenreExplorer";
import ArtistExplorer from "@/pages/ArtistExplorer";
import MoodCreator from "@/pages/MoodCreator";
import MustListen from "@/pages/MustListen";
import ReplayGenerator from "@/pages/ReplayGenerator";
import NotFound from "@/pages/not-found";
import GenrePlaylistGenerator from "@/pages/GenrePlaylistGenerator";
import MoodPlaylistGenerator from "@/pages/MoodPlaylistGenerator";
import ArtistPlaylistGenerator from "@/pages/ArtistPlaylistGenerator";
import SearchPage from "@/pages/SearchPage";
import ArtistDetailPage from "@/pages/ArtistDetailPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/callback" component={Callback} />
      <Route path="/genre-explorer" component={GenreExplorer} />
      <Route path="/artist-explorer" component={ArtistExplorer} />
      <Route path="/create-playlist/genre" component={GenrePlaylistGenerator} />
      <Route path="/create-playlist/mood" component={MoodPlaylistGenerator} />
      <Route path="/create-playlist/artist" component={ArtistPlaylistGenerator} />
      <Route path="/mood-creator" component={MoodCreator} />
      <Route path="/must-listen" component={MustListen} />
      <Route path="/replay-generator" component={ReplayGenerator} />
      <Route path="/search" component={SearchPage} />
      <Route path="/artist/:id">
        {({ id }) => <ArtistDetailPage key={id} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
