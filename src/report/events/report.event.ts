import { ReportClassification } from '../constants';

export interface IReportEvent {
  targetName: string;
  targetId: string;
  classification: ReportClassification;
  userId: string;
}

export class ReportCreatedEvent implements IReportEvent {
  constructor(data: IReportEvent) {
    for (const key in data) {
      if (this.hasOwnProperty(key)) {
        (<any>this)[key] = data[key];
      }
    }
  }

  targetName: string;
  targetId: string;
  classification: ReportClassification;
  userId: string;
}
