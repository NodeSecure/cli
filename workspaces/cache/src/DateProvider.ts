export interface DateProvider {
  now(): number;
  oneYearAgo(): Date;
}

export class SystemDateProvider implements DateProvider {
  now(): number {
    return Date.now();
  }

  oneYearAgo(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);

    return date;
  }
}
