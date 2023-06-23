import { NextApiRequest, NextApiResponse } from "next";
import lpsolve from 'lp_solve';

interface Product {
  name: string
  demand: number
  objectiveWeight: number
}

interface Processor {
  name: string
  avaliableTime: number
  productOutputs: {productName: string, output: number}[]
}

const defaultProducts: Product[] = [
  {
    name: 'apples',
    demand: 45,
    objectiveWeight: 1,
  },
  {
    name: 'oranges',
    demand: 5,
    objectiveWeight: 1,
  },
];

const defaultProcessors: Processor[] = [
  {
    name: 'Desert',
    avaliableTime: 2400,
    productOutputs: [
      { productName: 'apples', output: 50, },
      { productName: 'oranges', output: 24, },
    ]
  },
  {
    name: 'Tundra',
    avaliableTime: 2100,
    productOutputs: [
      { productName: 'apples', output: 30, },
      { productName: 'oranges', output: 33, },
    ]
  },
]
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // const products: Product[] =  req.body.products;
  // const processors: Processor[] =  req.body.processors;
  const products: Product[] =  defaultProducts;
  const processors: Processor[] =  defaultProcessors;
  const Row = lpsolve.Row;

  const lp = new lpsolve.LinearProgram();
  

  const columns = products.map(({ name, demand }) => ({
    column: lp.addColumn(name), 
    demand,
    name
  }))
  // const x = lp.addColumn('x'); // lp.addColumn('x', true) for integer 
  // const y = lp.addColumn('y'); // lp.addColumn('y', false, true) for binary 


  const objective = columns.reduce(
    (row, { column, demand }) => row.Add(column, demand),
  new Row())

  lp.setObjective(objective);

  const processorTimes = processors.map(({ productOutputs, name: processorName, avaliableTime: avaliableTIme }) => {
    const outputsRow = productOutputs.reduce((row, { productName, output }) => {
      const maybeColumn = columns.find(({ name }) => name === productName);
      if (maybeColumn) {
        return row.Add(maybeColumn.column, output);
      }
      return row;
    }, new Row())
    return {
      row: outputsRow,
      processorName,
      avaliableTIme
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