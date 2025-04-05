import { users, playlists, type User, type InsertUser, type Playlist, type InsertPlaylist } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserBySpotifyId(spotifyId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(spotifyId: string, accessToken: string, refreshToken: string, expiresAt: Date): Promise<User | undefined>;
  
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  getPlaylistsByUserId(userId: number): Promise<Playlist[]>;
  getPlaylist(id: number): Promise<Playlist | undefined>;
  getRecentPlaylistsByUserId(userId: number, limit: number): Promise<Playlist[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private playlists: Map<number, Playlist>;
  userCurrentId: number;
  playlistCurrentId: number;

  constructor() {
    this.users = new Map();
    this.playlists = new Map();
    this.userCurrentId = 1;
    this.playlistCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserBySpotifyId(spotifyId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.spotifyId === spotifyId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUserTokens(
    spotifyId: string, 
    accessToken: string, 
    refreshToken: string, 
    expiresAt: Date
  ): Promise<User | undefined> {
    const user = await this.getUserBySpotifyId(spotifyId);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      accessToken,
      refreshToken,
      expiresAt
    };

    this.users.set(user.id, updatedUser);
    return updatedUser;
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const id = this.playlistCurrentId++;
    const playlist: Playlist = { 
      ...insertPlaylist, 
      id, 
      createdAt: new Date() 
    };
    this.playlists.set(id, playlist);
    return playlist;
  }

  async getPlaylistsByUserId(userId: number): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter(
      (playlist) => playlist.userId === userId,
    );
  }

  async getPlaylist(id: number): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }

  async getRecentPlaylistsByUserId(userId: number, limit: number): Promise<Playlist[]> {
    return Array.from(this.playlists.values())
      .filter(playlist => playlist.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
