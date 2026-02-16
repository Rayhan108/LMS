import {  Types } from 'mongoose';

export interface IClass {
  course: Types.ObjectId;
  title: string;
  date: Date;
  time: string;
  details: string;
  document?: string;
  link: string;
  createdBy: Types.ObjectId;
}