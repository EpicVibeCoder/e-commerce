import DataLoader from "dataloader";
import { PrismaService } from "src/prisma/prisma.service";

export type CategoryLoaderRow = {
      id: string;
      name: string;
      slug: string;
};

export function createCategoryLoader(prisma: PrismaService) {
      return new DataLoader<string, CategoryLoaderRow | null>(async (ids) => {
            const rows = await prisma.category.findMany({
                  where: { id: { in: [...ids] } },
                  select: { id: true, name: true, slug: true },
            });

            const byId = new Map(rows.map((row) => [row.id, row]));

            // Must match ids length + order
            return ids.map((id) => byId.get(id) ?? null);
      });
}

export type CategoryLoader = ReturnType<typeof createCategoryLoader>;
