import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { TokenResponce } from './auth.interface';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  http = inject(HttpClient);
  cookieService = inject(CookieService);
  router = inject(Router);
  baseApiUrl = 'https://icherniakov.ru/yt-course/auth/';

  token: string | null = null;
  refreshToken: string | null = null;

  get isAuth() {
    if (!this.token) {
      (this.token = this.cookieService.get('token')),
        (this.refreshToken = this.cookieService.get('refreshToken'));
    }
    return !!this.token;
  }

  login(payload: { username: string; password: string }) {
    const fd = new FormData();

    fd.append('username', payload.username);
    fd.append('password', payload.password);

    return this.http
      .post<TokenResponce>(`${this.baseApiUrl}token`, fd)
      .pipe(tap((val) => this.saveTokens(val)));
  }

  refreshAuthToken() {
    return this.http
      .post<TokenResponce>(`${this.baseApiUrl}refresh`, {
        refresh_token: this.refreshToken,
      })
      .pipe(
        tap((val) => this.saveTokens(val)),
        catchError((err) => {
          this.logout();
          return throwError(err);
        })
      );
  }

  logout() {
    this.cookieService.deleteAll();
    this.token = null;
    this.refreshToken = null;
    this.router.navigate(['/login']);
  }

  saveTokens(res: TokenResponce) {
    this.token = res.access_token;
    this.refreshToken = res.refresh_token;

    this.cookieService.set('token', this.token);
    this.cookieService.set('refreshToken', this.refreshToken);
  }
}