/**
 * Centralized time utility for consistent timestamp handling across the application
 * All times are stored in UTC and converted for display based on user preferences
 */

// Configuration
const TIME_CONFIG = {
  // Store everything in UTC for consistency
  storageTimezone: 'UTC',
  // Default display format (Indian locale)
  dateFormat: 'en-IN',
  // Default timezone for display (Indian timezone)
  displayTimezone: 'Asia/Kolkata'
};

/**
 * Gets the current timestamp in ISO format (UTC)
 * Use this for all database operations and API responses
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Gets the current date in YYYY-MM-DD format
 * Use this for task_date fields
 */
export function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Gets the current time in HH:MM format (24-hour)
 * Use this for start_time and end_time fields
 */
export function getCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

/**
 * Gets the user's timezone offset in minutes
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Gets the user's timezone identifier
 */
export function getUserTimezone(): string {
  try {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Handle both Asia/Calcutta and Asia/Kolkata (they're the same)
    if (detectedTimezone === 'Asia/Calcutta') {
      return 'Asia/Kolkata';
    }
    return detectedTimezone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata'; // Default to Indian timezone
  }
}

/**
 * Formats a task date for display
 * @param dateString - Date in YYYY-MM-DD format
 * @param locale - Optional locale override
 */
export function formatTaskDate(dateString: string | null, locale?: string): string {
  if (!dateString) return '';

  try {
    // Create date at midnight UTC to avoid timezone shifts
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date.toLocaleDateString(locale || TIME_CONFIG.dateFormat);
  } catch {
    return dateString;
  }
}

/**
 * Formats a task time for display
 * @param timeString - Time in HH:MM or HH:MM:SS format
 * @param use24Hour - Whether to use 24-hour format (default: false)
 */
export function formatTaskTime(timeString: string | null, use24Hour: boolean = false): string {
  if (!timeString) return '';

  try {
    // Handle both HH:MM and HH:MM:SS formats
    let timeForParsing = timeString;
    if (timeString.split(':').length === 2) {
      // HH:MM format - add seconds
      timeForParsing = timeString + ':00';
    }
    
    // Create a date with the time (using arbitrary date)
    const date = new Date(`2000-01-01T${timeForParsing}`);
    return date.toLocaleTimeString(TIME_CONFIG.dateFormat, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour
    });
  } catch {
    return timeString;
  }
}

/**
 * Formats a log timestamp for display
 * @param timestamp - ISO timestamp string
 * @param options - Formatting options
 */
export function formatLogTimestamp(
  timestamp: string,
  options: {
    includeDate?: boolean;
    includeTime?: boolean;
    includeSeconds?: boolean;
    timezone?: string;
    locale?: string;
  } = {}
): string {
  if (!timestamp) return '';

  const {
    includeDate = true,
    includeTime = true,
    includeSeconds = false,
    timezone = getUserTimezone(),
    locale = 'en-IN' // Default to Indian locale
  } = options;

  try {
    // Handle different timestamp formats from database
    let date: Date;

    if (timestamp.includes('T')) {
      // ISO format: 2025-07-29T15:55:42.576Z
      date = new Date(timestamp);
    } else {
      // SQLite format: 2025-07-29 15:55:42
      date = new Date(timestamp + 'Z'); // Add Z to indicate UTC
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone
    };

    if (includeDate) {
      formatOptions.year = 'numeric';
      formatOptions.month = 'short';
      formatOptions.day = 'numeric';
    }

    if (includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      if (includeSeconds) {
        formatOptions.second = '2-digit';
      }
      formatOptions.hour12 = true;
    }

    return date.toLocaleString(locale, formatOptions);
  } catch {
    return timestamp;
  }
}

/**
 * Combines task date and time for display
 * @param dateString - Date in YYYY-MM-DD format
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 */
export function formatTaskDateTime(
  dateString: string | null,
  startTime: string | null,
  endTime: string | null
): string {
  const parts: string[] = [];

  if (dateString) {
    parts.push(formatTaskDate(dateString));
  }

  if (startTime || endTime) {
    const timeParts: string[] = [];

    if (startTime && endTime) {
      timeParts.push(`${formatTaskTime(startTime)} - ${formatTaskTime(endTime)}`);
    } else if (startTime) {
      timeParts.push(`${formatTaskTime(startTime)} (start only)`);
    } else if (endTime) {
      timeParts.push(`(end only) ${formatTaskTime(endTime)}`);
    }

    if (timeParts.length > 0) {
      if (parts.length > 0) {
        parts.push(': ' + timeParts.join(''));
      } else {
        parts.push(timeParts.join(''));
      }
    }
  }

  return parts.join('');
}

/**
 * Parses a date string and returns it in YYYY-MM-DD format
 * Handles various input formats
 */
export function parseToTaskDate(input: string | Date): string | null {
  if (!input) return null;

  try {
    const date = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(date.getTime())) return null;

    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Parses a time string and returns it in HH:MM format
 * Handles various input formats like "6pm", "18:00", "6:30 PM"
 */
export function parseToTaskTime(input: string): string | null {
  if (!input) return null;

  try {
    // Handle formats like "6pm", "6 PM", "18:00", "6:30 PM"
    const timeStr = input.toLowerCase().trim();

    // If already in HH:MM format
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }

    // Parse with Date object for complex formats
    const date = new Date(`2000-01-01 ${input}`);
    if (!isNaN(date.getTime())) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validates if end time is after start time
 */
export function validateTimeRange(startTime: string | null, endTime: string | null): boolean {
  if (!startTime || !endTime) return true; // Allow partial times

  try {
    // Handle both HH:MM and HH:MM:SS formats
    let startTimeForParsing = startTime;
    let endTimeForParsing = endTime;
    
    if (startTime.split(':').length === 2) {
      startTimeForParsing = startTime + ':00';
    }
    if (endTime.split(':').length === 2) {
      endTimeForParsing = endTime + ':00';
    }
    
    const start = new Date(`2000-01-01T${startTimeForParsing}`);
    const end = new Date(`2000-01-01T${endTimeForParsing}`);
    return end > start;
  } catch {
    return false;
  }
}

/**
 * Gets a relative time description (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(timestamp: string): string {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    // For older dates, show the actual date
    return formatLogTimestamp(timestamp, { includeTime: false });
  } catch {
    return timestamp;
  }
}

/**
 * Database-specific timestamp for PostgreSQL/Supabase
 * Returns timestamp in ISO format that PostgreSQL can understand
 * Always stores in UTC for consistency
 */
export function getDatabaseTimestamp(): string {
  // PostgreSQL prefers ISO format: 2025-07-30T15:55:42.576Z
  return new Date().toISOString();
}

/**
 * Gets current time in Indian timezone for display purposes
 */
export function getCurrentIndianTime(): string {
  const now = new Date();
  return now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Converts UTC timestamp to Indian timezone for display
 */
export function convertToIndianTime(utcTimestamp: string): string {
  if (!utcTimestamp) return '';

  try {
    // Handle different timestamp formats from database
    let date: Date;

    if (utcTimestamp.includes('T')) {
      // ISO format: 2025-07-29T15:55:42.576Z
      date = new Date(utcTimestamp);
    } else {
      // SQLite format: 2025-07-29 15:55:42
      date = new Date(utcTimestamp + 'Z'); // Add Z to indicate UTC
    }

    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return utcTimestamp;
  }
}