/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { DateFormat } from "./DateFormat";

export class Formatter {
  
  public static getFormattedDate(date: Date, format: DateFormat = DateFormat.MonthDayYearSlash): string {
    let month = date.getMonth() + 1; //January is 0; February is 1, etc
    let day = date.getDate();
    let year = date.getFullYear();

    switch (format) {
      case DateFormat.MonthDayYearSlash:
        return `${month}/${day}/${year}`;
      case DateFormat.DayMonthYearSlash:
        return `${day}/${month}/${year}`;
      case DateFormat.YearMonthDayDash:
        return `${year}-${month}-${day}`;
      case DateFormat.DayMonthYearDot:
        return `${day}.${month}.${year}`;
    }
  }
  
  public static getFormattedTimestamp(date: Date): string {
    let hours = date.getHours();
    let minutes = Formatter.leftpad(date.getMinutes());
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
 
