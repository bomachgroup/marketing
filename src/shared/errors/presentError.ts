export type ErrorPresentationContext =
  | 'default'
  | 'login'
  | 'form-submit'
  | 'page-load'
  | 'section-load'
  | 'background-action'

export interface UserFacingError {
  title: string
  message: string
  placement: 'field' | 'form' | 'toast' | 'section' | 'page'
  retryable: boolean
}

const TECHNICAL =
  /traceback|stack trace|django\.|pydantic|integrityerror|attributeerror|typeerror|keyerror|botocore|boto3|invalidaccesskeyid|signaturedoesnotmatch|for update cannot be applied|nullable side of an outer join|(?:not null|unique|foreign key) constraint failed|database is locked|sqlite(?:3)?\.|sql (?:syntax|error)/i

function placementFor(context: ErrorPresentationContext): UserFacingError['placement'] {
  if (context === 'page-load') return 'page'
  if (context === 'section-load') return 'section'
  if (context === 'form-submit' || context === 'login') return 'form'
  return 'toast'
}

function safeMessage(message: string | undefined, fallback: string): string {
  const value = message?.trim()
  if (!value) return fallback
  return TECHNICAL.test(value) ? fallback : value
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

/** Present API/runtime errors the same way Bomach OS does. */
export function presentError(
  error: unknown,
  context: ErrorPresentationContext = 'default',
): UserFacingError {
  const status =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : undefined
  const rawMessage =
    typeof error === 'string'
      ? error
      : typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : typeof error === 'object' &&
            error !== null &&
            'error' in error &&
            typeof (error as { error?: unknown }).error === 'string'
          ? (error as { error: string }).error
          : undefined

  if (status === 0 || (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'NETWORK_ERROR')) {
    const offline = isOffline()
    return {
      title: offline ? 'You are offline' : 'Connection problem',
      message: offline
        ? 'Reconnect to the internet, then try again.'
        : 'BOMACH OS could not reach the server. Check your connection or try again shortly.',
      placement: placementFor(context),
      retryable: true,
    }
  }

  if (status === 401) {
    return {
      title: 'Session expired',
      message: 'Sign in again to continue.',
      placement: 'toast',
      retryable: false,
    }
  }

  if (status === 403) {
    return {
      title: 'Permission required',
      message:
        context === 'page-load'
          ? 'Your account does not have access to this page.'
          : context === 'section-load'
            ? 'Your account does not have permission to view this section.'
            : 'You do not have permission to complete this action.',
      placement: placementFor(context),
      retryable: false,
    }
  }

  if (status === 404) {
    return {
      title: 'Record not found',
      message: 'This record may have been removed or you may no longer have access to it.',
      placement: placementFor(context),
      retryable: false,
    }
  }

  if (status === 429) {
    return {
      title: 'Too many requests',
      message: 'Please wait a moment before trying again.',
      placement: placementFor(context),
      retryable: true,
    }
  }

  if (typeof status === 'number' && status >= 500) {
    return {
      title: 'Service temporarily unavailable',
      message: 'BOMACH OS could not complete this request. Please try again shortly.',
      placement: placementFor(context),
      retryable: true,
    }
  }

  if (context === 'page-load' || context === 'section-load') {
    return {
      title: context === 'page-load' ? 'Unable to load this page' : 'Unable to load this section',
      message: safeMessage(rawMessage, 'An unexpected problem occurred. Please try again.'),
      placement: placementFor(context),
      retryable: true,
    }
  }

  return {
    title: 'Action unsuccessful',
    message: safeMessage(rawMessage, 'The action could not be completed. Please try again.'),
    placement: placementFor(context),
    retryable: true,
  }
}

export function presentErrorMessage(
  error: unknown,
  context: ErrorPresentationContext = 'default',
): string {
  return presentError(error, context).message
}
