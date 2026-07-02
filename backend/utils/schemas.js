const { z } = require('zod');

const idSchema = z.string().min(1);
const emailSchema = z.string().email();
const passwordSchema = z.string().min(8).max(128);
const nameSchema = z.string().min(2).max(120);

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: nameSchema,
    organizationName: nameSchema.optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1).max(128)
  })
});

const organizationSchema = z.object({
  body: z.object({
    name: nameSchema,
    slug: z.string().min(2).max(120).optional()
  })
});

const organizationIdParamSchema = z.object({
  params: z.object({
    organizationId: idSchema
  })
});

const updateOrganizationSchema = z.object({
  params: z.object({
    organizationId: idSchema
  }),
  body: z.object({
    name: nameSchema.optional(),
    slug: z.string().min(2).max(120).optional()
  })
});

const organizationMemberSchema = z.object({
  params: z.object({
    organizationId: idSchema
  }),
  body: z.object({
    userId: idSchema,
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER')
  })
});

const projectSchema = z.object({
  body: z.object({
    organizationId: idSchema,
    name: nameSchema,
    key: z.string().min(2).max(32),
    description: z.string().max(500).optional()
  })
});

const projectUpdateSchema = z.object({
  params: z.object({
    projectId: idSchema
  }),
  body: z.object({
    name: nameSchema.optional(),
    key: z.string().min(2).max(32).optional(),
    description: z.string().max(500).optional().nullable()
  }).optional()
});

const projectParamsSchema = z.object({
  params: z.object({
    projectId: idSchema
  })
});

const projectListQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    organizationId: idSchema
  })
});

const queueSchema = z.object({
  body: z.object({
    organizationId: idSchema,
    projectId: idSchema,
    retryPolicyId: idSchema.optional().nullable(),
    name: nameSchema,
    slug: z.string().min(2).max(64).optional(),
    description: z.string().max(500).optional(),
    priority: z.coerce.number().int().min(-100).max(100).optional(),
    concurrencyLimit: z.coerce.number().int().min(1).max(1000).optional(),
    rateLimitPerMinute: z.coerce.number().int().positive().optional().nullable(),
    shardKey: z.string().max(120).optional().nullable()
  })
});

const queueListQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    organizationId: idSchema,
    projectId: idSchema.optional()
  })
});

const updateQueueSchema = z.object({
  params: z.object({ queueId: idSchema }),
  body: z.object({
    name: nameSchema.optional(),
    slug: z.string().min(2).max(64).optional(),
    description: z.string().max(500).optional().nullable(),
    priority: z.coerce.number().int().min(-100).max(100).optional(),
    concurrencyLimit: z.coerce.number().int().min(1).max(1000).optional(),
    rateLimitPerMinute: z.coerce.number().int().positive().optional().nullable(),
    shardKey: z.string().max(120).optional().nullable()
  })
});

const queueParamsSchema = z.object({
  params: z.object({
    queueId: idSchema
  })
});

const queuePauseSchema = z.object({
  params: z.object({
    queueId: idSchema
  }),
  body: z.object({
    reason: z.string().max(500).optional()
  }).optional()
});

const queueResumeSchema = z.object({
  params: z.object({
    queueId: idSchema
  })
});

const jobPayloadSchema = z.record(z.any());
const jobTypeSchema = z.enum(['IMMEDIATE', 'DELAYED', 'SCHEDULED', 'RECURRING', 'BATCH']);

const createJobSchema = z.object({
  body: z.object({
    organizationId: idSchema,
    projectId: idSchema,
    queueId: idSchema,
    retryPolicyId: idSchema.optional().nullable(),
    type: jobTypeSchema.default('IMMEDIATE'),
    priority: z.coerce.number().int().min(-100).max(100).optional(),
    payload: jobPayloadSchema,
    runAt: z.coerce.date().optional(),
    cronExpression: z.string().min(3).max(120).optional(),
    timezone: z.string().min(2).max(64).optional(),
    maxAttempts: z.coerce.number().int().min(1).max(20).optional(),
    shardKey: z.string().max(120).optional().nullable(),
    dependencyJobId: idSchema.optional().nullable(),
    batch: z
      .object({
        items: z.array(jobPayloadSchema).min(1),
        batchGroupId: z.string().min(2).max(120).optional()
      })
      .optional()
  })
});

const workerHeartbeatSchema = z.object({
  body: z.object({
    workerId: idSchema,
    cpuUsage: z.number().min(0).max(100).optional(),
    memoryUsage: z.number().min(0).max(100).optional(),
    details: z.record(z.any()).optional()
  })
});

const claimJobsSchema = z.object({
  body: z.object({
    workerId: idSchema,
    queueIds: z.array(idSchema).optional(),
    limit: z.coerce.number().int().positive().max(50).optional()
  })
});

const jobListQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    status: z.enum(['QUEUED', 'SCHEDULED', 'CLAIMED', 'RUNNING', 'COMPLETED', 'FAILED', 'DEAD_LETTER']).optional(),
    type: jobTypeSchema.optional(),
    queueId: idSchema.optional(),
    projectId: idSchema.optional(),
    organizationId: idSchema,
    search: z.string().max(200).optional()
  })
});

const jobParamsSchema = z.object({
  params: z.object({
    jobId: idSchema
  })
});

const updateJobSchema = z.object({
  params: z.object({
    jobId: idSchema
  }),
  body: z.object({
    priority: z.coerce.number().int().min(-100).max(100).optional(),
    payload: jobPayloadSchema.optional(),
    maxAttempts: z.coerce.number().int().min(1).max(20).optional(),
    runAt: z.coerce.date().optional(),
    scheduledFor: z.coerce.date().optional(),
    shardKey: z.string().max(120).optional().nullable()
  })
});

const deadLetterListQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    organizationId: idSchema
  })
});

const deadLetterParamsSchema = z.object({
  params: z.object({
    jobId: idSchema
  })
});

const logListQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    organizationId: idSchema,
    jobId: idSchema.optional(),
    level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).optional()
  })
});

const workerRegisterSchema = z.object({
  body: z.object({
    name: nameSchema,
    host: nameSchema,
    pid: z.coerce.number().int().nonnegative(),
    capacity: z.coerce.number().int().positive().max(100).optional(),
    version: z.string().max(50).optional()
  })
});

const workerIdParamSchema = z.object({
  params: z.object({
    workerId: idSchema
  })
});

const workerStatusSchema = z.object({
  params: z.object({
    workerId: idSchema
  }),
  body: z.object({
    status: z.enum(['ONLINE', 'DRAINING', 'OFFLINE'])
  })
});

const workerListQuerySchema = z.object({
  query: paginationQuerySchema.extend({
    status: z.enum(['ONLINE', 'DRAINING', 'OFFLINE']).optional()
  })
});

const updateWorkerSchema = z.object({
  params: z.object({
    workerId: idSchema
  }),
  body: z.object({
    name: nameSchema.optional(),
    host: nameSchema.optional(),
    capacity: z.coerce.number().int().positive().max(100).optional(),
    version: z.string().max(50).optional()
  })
});

const dashboardQuerySchema = z.object({
  query: z.object({
    organizationId: idSchema
  })
});

const jobLogQuerySchema = logListQuerySchema;

module.exports = {
  registerSchema,
  loginSchema,
  organizationSchema,
  organizationIdParamSchema,
  updateOrganizationSchema,
  organizationMemberSchema,
  projectSchema,
  projectUpdateSchema,
  projectParamsSchema,
  projectListQuerySchema,
  queueSchema,
  queueListQuerySchema,
  queueParamsSchema,
  updateQueueSchema,
  queuePauseSchema,
  queueResumeSchema,
  createJobSchema,
  jobListQuerySchema,
  jobParamsSchema,
  updateJobSchema,
  workerHeartbeatSchema,
  claimJobsSchema,
  workerRegisterSchema,
  workerIdParamSchema,
  workerStatusSchema,
  workerListQuerySchema,
  updateWorkerSchema,
  dashboardQuerySchema,
  deadLetterListQuerySchema,
  deadLetterParamsSchema,
  logListQuerySchema,
  jobLogQuerySchema,
  paginationQuerySchema
};
