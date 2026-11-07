/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as path from "node:path";

type ParseState<T> = (content: string) => T;
type SerializeState<T> = (state: T) => string;
type ValidateState<T> = (state: unknown) => asserts state is T;

/**
 * Persists a validated JSON state file atomically in an application directory.
 */
export class JsonStateStorage<T> {

  public constructor(
    private readonly directory: string,
    private readonly fileName: string,
    private readonly parseState: ParseState<T>,
    private readonly validateState: ValidateState<T>,
    private readonly serializeState: SerializeState<T> = (state) => `${JSON.stringify(state, null, 2)}\n`
  ) {
  }

  /**
   * Returns the persisted state, or no value before it has been created.
   */
  public async getState(): Promise<T | undefined> {
    let content: string;

    try {
      content = await fs.promises.readFile(this.getStateFilePath(), "utf-8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }

      throw err;
    }

    return this.parseState(content);
  }

  /**
   * Validates and writes state through a temporary file before replacing it.
   */
  public async setState(state: T): Promise<void> {
    this.validateState(state);
    await fs.promises.mkdir(this.directory, { recursive: true });

    const stateFilePath = this.getStateFilePath();
    const temporaryFilePath = `${stateFilePath}.tmp`;

    await fs.promises.writeFile(temporaryFilePath, this.serializeState(state), "utf-8");
    await fs.promises.rename(temporaryFilePath, stateFilePath);
  }

  /**
   * Returns the location of the managed JSON file.
   */
  public getStateFilePath(): string {
    return path.join(this.directory, this.fileName);
  }

}
