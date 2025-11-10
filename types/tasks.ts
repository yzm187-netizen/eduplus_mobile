export type TaskNode = {
  id: string;
  title: string;
  done: boolean;
  children?: TaskNode[];
};
