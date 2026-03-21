export interface WebConfig {
  key: string;
  value: string;
}

export interface IWebConfigRepository {
  getConfig(): Promise<Record<string, string>>;
  updateConfig(key: string, value: string): Promise<void>;
}
