import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GetAuditLogsDto } from '../common/dto/audit.dto';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(businessId: string, query: GetAuditLogsDto) {
    const { page = 1, limit = 10, action, entityType, entityId } = query;
    const skip = (page - 1) * limit;

    const where: any = { businessId };
    
    if (action) {
      where.action = action;
    }
    
    if (entityType) {
      where.entityType = entityType;
    }
    
    if (entityId) {
      where.entityId = entityId;
    }

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: auditLogs,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async create(auditLogData: {
    businessId: string;
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: auditLogData,
    });
  }

  async findOne(id: string, businessId: string) {
    return this.prisma.auditLog.findFirst({
      where: { id, businessId },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}

