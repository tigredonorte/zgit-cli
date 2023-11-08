import { Container } from 'inversify';
import 'reflect-metadata';
import simpleGit, { SimpleGit } from 'simple-git';
import {
  BranchHelper,
  ChildrenHelper,
  ParentHelper,
  PrefixHelper,
} from '../helpers/index';
import TYPES from './types';

const myContainer = new Container();
myContainer.bind<SimpleGit>(TYPES.SimpleGit).toConstantValue(simpleGit());
myContainer.bind<BranchHelper>(TYPES.BranchHelper).to(BranchHelper);
myContainer.bind<ChildrenHelper>(TYPES.ChildrenHelper).to(ChildrenHelper);
myContainer.bind<PrefixHelper>(TYPES.PrefixHelper).to(PrefixHelper);
myContainer.bind<ParentHelper>(TYPES.ParentHelper).to(ParentHelper);

export { myContainer };
