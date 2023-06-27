import lpsolve from 'lp_solve';
import type { Processor, Product } from '~/server/types';


export default function calculate(products: Product[], processors: Processor[]) {
  const Row = lpsolve.Row;

  const lp = new lpsolve.LinearProgram();
  

  const columns = products.map(({ name, demand }) => ({
    column: lp.addColumn(name), 
    demand: demand,
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
        return row.Add(maybeColumn.column, output);
      }
      return row;
    }, new Row())
    return {
      row: outputsRow,
      processorName,
      avaliableTIme: avaliableTIme
    };
  })

  // const machineatime = new Row().Add(x, xNumA).Add(y, yNumA);
  processorTimes.forEach(({ row, processorName, avaliableTIme}) => {
    lp.addConstraint(row, 'LE', avaliableTIme, `processor ${processorName} time`)
  })

  // lp.addConstraint(machinebtime, 'LE', bTimeConstraint, 'machine b time')
  columns.forEach(({ column, demand, name }) => {
    lp.addConstraint(new Row().Add(column, 1), 'GE', demand, `meet demand of ${name}`)
  })

  const result = lp.solve()
  
  const productResults = products.map(({ name }) => ({ result: lp.get(name), productName: name }))
  const time = processorTimes.map(({ row, processorName }) => ({ result: lp.calculate(row), processorName }))

  return {
    program: lp.dumpProgram(),
    result,
    objectiveValue:  lp.getObjectiveValue(),
    productResults,
    time,
  };
}