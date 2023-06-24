import { NextApiRequest, NextApiResponse } from "next";
import lpsolve from 'lp_solve';


interface Product {
  id: string;
  name: string;
  demand: string;
  objectiveWeight: number;
}

interface Processor {
  id: string;
  name: string;
  avaliableTime: string;
  productOutputs: { productId: string; productName: string; output: string }[];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const products: Product[] =  req.body.products;
  const processors: Processor[] =  req.body.processors;

  const Row = lpsolve.Row;

  const lp = new lpsolve.LinearProgram();
  

  const columns = products.map(({ name, demand }) => ({
    column: lp.addColumn(name), 
    demand: parseFloat(demand),
    name
  }))

  const objective = columns.reduce(
    (row, { column, demand }) => row.Add(column, demand),
  new Row())

  lp.setObjective(objective);

  const processorTimes = processors.map(({ productOutputs, name: processorName, avaliableTime: avaliableTIme }) => {
    const outputsRow = productOutputs.reduce((row, { productName, output }) => {
      const maybeColumn = columns.find(({ name }) => name === productName);
      if (maybeColumn) {
        return row.Add(maybeColumn.column, parseFloat(output));
      }
      return row;
    }, new Row())
    return {
      row: outputsRow,
      processorName,
      avaliableTIme: parseFloat(avaliableTIme)
    };
  })

  // const machinebtime = new Row().Add(x, xNumB).Add(y, yNumB);
  // const machineatime = new Row().Add(x, xNumA).Add(y, yNumA);
  processorTimes.forEach(({ row, processorName, avaliableTIme}) => {
    lp.addConstraint(row, 'LE', avaliableTIme, `processor ${processorName} time`)
  })

  // lp.addConstraint(machinebtime, 'LE', bTimeConstraint, 'machine b time')
  columns.forEach(({ column, demand, name }) => {
    lp.addConstraint(new Row().Add(column, 1), 'GE', demand, `meet demand of ${name}`)
  })
  // lp.addConstraint(new Row().Add(y, 1), 'GE', yDemand, 'meet demand of y')
  const result = lp.solve()
  
  const productResults = products.map(({ name }) => ({ result: lp.get(name), productName: name }))
  const time = processorTimes.map(({ row, processorName }) => ({ result: lp.calculate(row), processorName }))
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
    productResults,
    time,
  });
}