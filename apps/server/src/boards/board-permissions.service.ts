import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardMember } from '../entities/board-member.entity';

@Injectable()
export class BoardPermissionsService {
  constructor(
    @InjectRepository(BoardMember)
    private memberRepo: Repository<BoardMember>,
  ) {}

  async ensureMember(boardId: string, userId: string, role: string = 'editor') {
    const existing = await this.memberRepo.findOne({
      where: { board_id: boardId, user_id: userId },
    });
    if (existing) {
      return existing;
    }
    const member = this.memberRepo.create({ board_id: boardId, user_id: userId, role });
    return this.memberRepo.save(member);
  }

  async userCanEdit(boardId: string, userId: string) {
    const member = await this.memberRepo.findOne({
      where: { board_id: boardId, user_id: userId },
    });
    if (!member) return false;
    return member.role === 'editor' || member.role === 'owner';
  }
}

