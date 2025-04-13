export interface Comment {
  id: string;
  content: string;
  userId: string;
  maintenanceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CommentEntity implements Comment {
  id: string;
  content: string;
  userId: string;
  maintenanceId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: Comment) {
    this.id = params.id;
    this.content = params.content;
    this.userId = params.userId;
    this.maintenanceId = params.maintenanceId;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static create(params: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): CommentEntity {
    return new CommentEntity({
      id: crypto.randomUUID(),
      ...params,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  update(content: string): CommentEntity {
    this.content = content;
    this.updatedAt = new Date();
    return this;
  }
} 