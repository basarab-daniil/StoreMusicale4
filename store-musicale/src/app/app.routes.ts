import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Home } from './components/home/home';
import { AlbumDetail } from './components/album-detail/album-detail';
import { ArtistaDetail } from './components/artista-detail/artista-detail';
import { Playlist } from './components/playlist/playlist';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home },
  { path: 'album/:id', component: AlbumDetail },
  { path: 'artista/:id', component: ArtistaDetail },
  { path: 'playlist', component: Playlist },
  { path: '**', redirectTo: '/login' }
];
