import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { ok, err } from '@theia-core/result';
import type { Result, DomainError } from '@theia-core/result';
import type { TheiaDb } from '../connection';
import { profiles, profileAgents } from '../schema';
import type { IProfileRepo, ProfileRow } from '../../types';
import { DATABASE_CONNECTION } from '../../types';

@Injectable()
export class ProfilesRepo implements IProfileRepo {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: TheiaDb) {}

  async findAll(tenantId: string): Promise<Result<ProfileRow[], DomainError>> {
    try {
      const rows = await this.db
        .select()
        .from(profiles)
        .where(and(eq(profiles.tenantId, tenantId), eq(profiles.isActive, true)));

      const result = await Promise.all(rows.map((p) => this.withAgents(p)));
      return ok(result);
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  async findBySlug(slug: string, tenantId: string): Promise<Result<ProfileRow, DomainError>> {
    try {
      const [row] = await this.db
        .select()
        .from(profiles)
        .where(and(eq(profiles.slug, slug), eq(profiles.tenantId, tenantId), eq(profiles.isActive, true)))
        .limit(1);

      if (!row) {
        return err({ code: 'NOT_FOUND', message: `Profile '${slug}' not found`, details: {} } as DomainError);
      }
      return ok(await this.withAgents(row));
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  async upsert(profile: {
    id?: string;
    tenantId: string;
    slug: string;
    name: string;
    description?: string | null;
    version?: number;
    isActive?: boolean;
    agents: Array<{ agentId: string; sequence: number; context: string | null; requires: string[] }>;
  }): Promise<Result<ProfileRow, DomainError>> {
    try {
      const version = profile.version ?? 1;
      const isActive = profile.isActive ?? true;

      const [inserted] = await this.db
        .insert(profiles)
        .values({
          id: profile.id as string | undefined,
          tenantId: profile.tenantId,
          slug: profile.slug,
          name: profile.name,
          description: profile.description ?? null,
          version,
          isActive,
        })
        .onConflictDoUpdate({
          target: [profiles.tenantId, profiles.slug, profiles.version],
          set: { name: profile.name, description: profile.description ?? null, isActive },
        })
        .returning();

      if (!inserted) {
        return err({ code: 'INTERNAL', message: 'Upsert returned no row', details: {} } as DomainError);
      }

      // Always replace agents (handles empty array → deletes all)
      await this.db.delete(profileAgents).where(eq(profileAgents.profileId, inserted.id));
      if (profile.agents.length > 0) {
        await this.db.insert(profileAgents).values(
          profile.agents.map((a) => ({
            profileId: inserted.id,
            agentId: a.agentId,
            sequence: a.sequence,
            context: a.context,
            requires: a.requires,
          })),
        );
      }

      return ok(await this.withAgents(inserted));
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  private async withAgents(
    profile: typeof profiles.$inferSelect,
  ): Promise<ProfileRow> {
    const agents = await this.db
      .select()
      .from(profileAgents)
      .where(eq(profileAgents.profileId, profile.id))
      .orderBy(profileAgents.sequence);

    return {
      id: profile.id,
      tenantId: profile.tenantId,
      slug: profile.slug,
      name: profile.name,
      description: profile.description,
      version: profile.version,
      isActive: profile.isActive,
      agents: agents.map((a) => ({
        agentId: a.agentId,
        sequence: a.sequence,
        context: a.context,
        requires: a.requires ?? [],
      })),
    };
  }
}
