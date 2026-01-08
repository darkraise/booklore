import {inject, Injectable, OnDestroy} from '@angular/core';
import {User, UserService, UserSettings} from '../user-management/user.service';
import {MessageService} from 'primeng/api';
import {catchError, filter, takeUntil} from 'rxjs/operators';
import {Subject, throwError} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {API_CONFIG} from '../../../core/config/api-config';

@Injectable({providedIn: 'root'})
export class ReaderPreferencesService implements OnDestroy {
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly http = inject(HttpClient);
  private readonly userUrl = `${API_CONFIG.BASE_URL}/api/v1/users`;
  private currentUser: User | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.userService.userState$.pipe(
      filter(userState => !!userState?.user && userState.loaded),
      takeUntil(this.destroy$)
    ).subscribe(userState => this.currentUser = userState.user);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updatePreference(path: string[], value: unknown): void {
    if (!this.currentUser) return;

    // Store original value for rollback
    let target: any = this.currentUser.userSettings;
    const [rootKey] = path;
    const originalValue = JSON.parse(JSON.stringify(target[rootKey]));

    // Update local state
    for (let i = 0; i < path.length - 1; i++) {
      target = target[path[i]] ||= {};
    }
    target[path.at(-1)!] = value;

    const updatedValue = this.currentUser.userSettings[rootKey as keyof UserSettings];

    // Call backend with error handling
    const payload = { key: rootKey, value: updatedValue };
    this.http.put<void>(`${this.userUrl}/${this.currentUser.id}/settings`, payload, {
      headers: {'Content-Type': 'application/json'},
      responseType: 'text' as 'json'
    })
      .pipe(
        catchError(error => {
          // Rollback on error
          (this.currentUser!.userSettings as any)[rootKey] = originalValue;
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: 'Failed to save preferences. Please try again.',
            life: 3000
          });
          return throwError(() => error);
        })
      )
      .subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Preferences Updated',
          detail: 'Your preferences have been saved successfully.',
          life: 2000
        });
      });
  }
}
