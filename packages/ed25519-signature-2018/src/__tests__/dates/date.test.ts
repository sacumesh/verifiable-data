import moment from "moment";
import fs from "fs";
import path from "path";

import {
  issuedOn,
  createCredential,
  createSuite,
  signCredential,
  verifyProof,
  createdOn
} from "./date-utils";

// Prevent console warnings from cluttering tests
console.warn = () => {};

const TESTS = [
  // Used as a flag to unset `issuanceDate` in the document for the 1st and 4th tests
  // This behavior doesn't carry over to tests 2 and 3 and is treated as a duplicate null test
  "removed",
  undefined,
  null,
  0,
  "",
  "foobar",
  // Int conditions
  1635774995208,
  -1635774995208,
  1,
  -1,
  123,
  -123,
  12345,
  -12345,
  // Date String conditions
  moment(issuedOn).format(),
  moment(issuedOn).format("dddd, MMMM Do YYYY, h:mm:ss a"),
  moment(issuedOn).format("Do dddd MMMM gggg"),
  moment(issuedOn).format("dddd MMMM DD, YYYY"),
  moment(issuedOn).format("D MMM YYYY"),
  moment(issuedOn).format("YYYY-MM-DD"),
  moment(issuedOn).format("ddd, DD MMM YYYY HH:mm:ss z"),
  moment(issuedOn).format("MM DD YYYY"),
  moment(issuedOn).format("MMM D, YYYY"),
  moment(issuedOn).format("YYYY-MM-DD[T]HH:mm:ss"),
  moment(issuedOn).format("YYYY-MM-DD[T]HH:mm:ss:SSSZ"),
  moment(issuedOn).format("YYYY-MM-DD[T]HH:mm:ss[Z]"),
  moment(issuedOn).format("YYYY-MM-DD[T]HH:mmZ"),
  moment(issuedOn).toJSON(),
  moment(issuedOn).toArray(),
  moment(issuedOn).toObject()
];

const getFixture = (testNum: number, index: number) => {
  const dirs = ["issuanceDate", "suiteDirect", "issuanceDateSuite"];

  const filename = path.resolve(
    __dirname,
    `../../__fixtures__/credentials/${dirs[testNum - 1]}/case-${index}.json`
  );

  const data = fs.readFileSync(filename, "utf-8");
  return JSON.parse(data);
};

// The fixture has an error but we dont
const isErrorInFixtureExpected = (output: any, fixture: any) => {
  return fixture.type === "error" && output.type !== "error";
};

// We have an error, but the fixture doesn't
const hasOurLibraryDriftedFromTheFixture = (output: any, fixture: any) => {
  return fixture.type !== "error" && output.type === "error";
};

// We have an error, and the fixture has an error
const doWeErrorWhenDigitalBazaarErrors = (output: any, fixture: any) => {
  return fixture.type === "error" && output.type === "error";
};

const isOutputAndFixtureMatchingExpectations = (output: any, fixture: any) => {
  const clonedOutput = JSON.parse(JSON.stringify(output));
  const clonedFixture = JSON.parse(JSON.stringify(fixture));

  delete clonedOutput.proof;
  delete clonedOutput.issuanceDate;

  delete clonedFixture.proof;
  delete clonedFixture.issuanceDate;

  // We make sure the input documents are the same
  expect(clonedOutput).toEqual(clonedFixture);

  // We expect these to thrash, not going to check

  // Then we want to make that the created dates and hashes work
  // expect(outputProof.created).toEqual(fixtureProof.created);
  // expect(outputProof.jws).toEqual(fixtureProof.jws);
};

const compareResults = async (output: any, fixture: any) => {
  // Option 1, The fixture has an error and we don't
  if (isErrorInFixtureExpected(output, fixture)) {
    throw new Error(
      "We expected an error given the fixture, but our code did not produce one"
    );
  }

  // Option 2, we have an error, the fixture doesn't
  if (hasOurLibraryDriftedFromTheFixture(output, fixture)) {
    throw new Error("Our code is producing an error that we didn't expect");
  }

  // Option 3. We both have errors, are they the same error?
  if (doWeErrorWhenDigitalBazaarErrors(output, fixture)) {
    // we dont want to continue,
    // expected errors, "good" result
    return;
  }

  isOutputAndFixtureMatchingExpectations(output, fixture);

  // We also expect that the signed credentials are verifiable
  const result1 = await verifyProof(output);
  expect(result1.verified).toBeTruthy();

  const result2 = await verifyProof(fixture);
  expect(result2.verified).toBeTruthy();
};

describe("Test 1. Confirm behavior of issuanceDate", () => {
  const testNum = 1;

  // Skipping toObject test as JSON-LD error pending further investigation
  // https://github.com/transmute-industries/verifiable-data/issues/124
  for (let i = 0; i < TESTS.length - 1; i++) {
    const date = TESTS[i];

    it(`1. case-${i} ${JSON.stringify(
      date
    )} should match the verifiable credential`, async () => {
      const fixture = getFixture(testNum, i);
      const { suite, suiteError } = await createSuite(createdOn);
      if (suiteError) {
        return compareResults(suiteError, fixture);
      }

      const unsignedCredential = createCredential(undefined);

      switch (date) {
        case "removed":
          // @ts-ignore
          delete unsignedCredential.issuanceDate;
          break;
        default:
          unsignedCredential.issuanceDate = date;
          break;
      }

      const { proof, signError } = await signCredential(
        suite!,
        unsignedCredential
      );

      if (signError) {
        return await compareResults(signError, fixture);
      }

      await compareResults({ proof, ...unsignedCredential }, fixture);
    });
  }
});

describe("Test 2. Confirm behavior of suite date set directly", () => {
  const testNum = 2;
  for (let i = 0; i < TESTS.length; i++) {
    const date = TESTS[i];
    it(`2. case-${i} ${JSON.stringify(
      date
    )} should match the verifiable credential`, async () => {
      const fixture = getFixture(testNum, i);
      const { suite, suiteError } = await createSuite(undefined);
      if (suiteError) {
        return compareResults(suiteError, fixture);
      }

      switch (date) {
        case "removed":
          // Per test we duplicate the null test
          suite!.date = null;
          break;
        case undefined:
          // This will generate a new date
          break;
        default:
          suite!.date = date;
          break;
      }

      const unsignedCredential = createCredential(undefined);
      const { proof, signError } = await signCredential(
        suite!,
        unsignedCredential
      );

      if (signError) {
        return await compareResults(signError, fixture);
      }
      await compareResults({ proof, ...unsignedCredential }, fixture);
    });
  }
});

describe("Test 3. Confirm behavior of issuanceDate", () => {
  const testNum = 3;
  for (let i = 0; i < TESTS.length; i++) {
    const date = TESTS[i];
    it(`3. case-${i}  ${JSON.stringify(
      date
    )} should match the verifiable credential`, async () => {
      const fixture = getFixture(testNum, i);

      const unsignedCredential = createCredential(undefined);
      switch (date) {
        case "removed":
          // @ts-ignore
          delete unsignedCredential.issuanceDate;
          break;
        default:
          // @ts-ignore
          unsignedCredential.issuanceDate = date;
          break;
      }

      const { suite, suiteError } = await createSuite(
        unsignedCredential.issuanceDate
      );

      if (suiteError) {
        return compareResults(suiteError, fixture);
      }

      const { proof, signError } = await signCredential(
        suite!,
        unsignedCredential
      );

      if (signError) {
        return await compareResults(signError, fixture);
      }

      await compareResults({ proof, ...unsignedCredential }, fixture);
    });
  }
});
