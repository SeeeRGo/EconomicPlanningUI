import { NextApiRequest, NextApiResponse } from "next";
import lpsolve from 'lp_solve';


export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const Row = lpsolve.Row;
  const xNumA = 50
  const yNumA = 24

  const xNumB = 30
  const yNumB = 33

  const aTimeConstraint = 2400
  const bTimeConstraint = 2100

  const xDemand = 45
  const yDemand = 5
  const lp = new lpsolve.LinearProgram();

  const x = lp.addColumn('x'); // lp.addColumn('x', true) for integer 
  const y = lp.addColumn('y'); // lp.addColumn('y', false, true) for binary 


  const objective = new Row().Add(x, 1).Add(y, 1);

  lp.setObjective(objective);

  const machineatime = new Row().Add(x, xNumA).Add(y, yNumA);
  lp.addConstraint(machineatime, 'LE', aTimeConstraint, 'machine a time')

  const machinebtime = new Row().Add(x, xNumB).Add(y, yNumB);
  lp.addConstraint(machinebtime, 'LE', bTimeConstraint, 'machine b time')

  lp.addConstraint(new Row().Add(x, 1), 'GE', xDemand, 'meet demand of x')
  lp.addConstraint(new Row().Add(y, 1), 'GE', yDemand, 'meet demand of y')
  const result = lp.solve()
  // console.log(lp.dumpProgram());
  // console.log(lp.solve());
  // console.log('objective =', lp.getObjectiveValue())
  // console.log('x =', lp.get(x));
  // console.log('y =', lp.get(y));
  // console.log('machineatime =', lp.calculate(machineatime));
  // console.log('machinebtime =', lp.calculate(machinebtime));
  res.status(200).json({
    program: lp.dumpProgram(),
    result,
    objectiveValue:  lp.getObjectiveValue(),
    x: lp.get(x),
    y: lp.get(y),
    aTime: lp.calculate(machineatime),
    bTime: lp.calculate(machinebtime),
  });
}