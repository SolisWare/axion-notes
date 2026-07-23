/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { DateFormat } from "./DateFormat";
import { TimeFormat } from "./TimeFormat";

export class Formatter {

  public static toDate(date: Date | string): Date {
    return date instanceof Date ? date : new Date(date);
  }

  public static toOptionalDate(date: Date | string | undefined): Date | undefined {
    return date === undefined ? undefined : Formatter.toDate(date);
  }
  
  public static getFormattedDate(date: Date, format: DateFormat = DateFormat.MonthDayYearSlash): string {
    let month = date.getMonth() + 1; //January is 0; February is 1, etc
    let day = date.getDate();
    let year = date.getFullYear();
    let shortYear = `${year}`.slice(-2);
    let paddedMonth = Formatter.leftpad(month);
    let paddedDay = Formatter.leftpad(day);

    switch (format) {
      case DateFormat.MonthDayYearShortSlash:
        return `${month}/${day}/${shortYear}`;
      case DateFormat.MonthDayYearSlash:
        return `${month}/${day}/${year}`;
      case DateFormat.DayMonthYearShortSlash:
        return `${day}/${month}/${shortYear}`;
      case DateFormat.DayMonthYearSlash:
        return `${day}/${month}/${year}`;
      case DateFormat.DayMonthYearDot:
        return `${paddedDay}.${paddedMonth}.${year}`;
      case DateFormat.DayMonthYearDash:
        return `${paddedDay}-${paddedMonth}-${year}`;
      case DateFormat.YearMonthDaySlash:
        return `${year}/${month}/${day}`;
      case DateFormat.YearMonthDayDot:
        return `${year}.${paddedMonth}.${paddedDay}`;
      case DateFormat.YearMonthDayDash:
        return `${year}-${paddedMonth}-${paddedDay}`;
    }
  }
  
  public static getFormattedTimestamp(date: Date, format: TimeFormat = TimeFormat.Regular): string {
    let hours = date.getHours();
    let minutes = Formatter.leftpad(date.getMinutes());

    if (format === TimeFormat.Military) {
      return `${hours}:${minutes}`;
    }

    let period = (hours > 12) ? "PM" : "AM";
    
    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }
    
    return `${hours}:${minutes} ${period}`;
  }
  
  private static leftpad(number: number): string {
    return number < 10 ? `0${number}` : `${number}`;
  }
}
 
