/**
 * Tests unitarios completos para PaginationDto
 * Coverage: create, constructor, getPaginationParams, sorting validation
 */

import { PaginationDto } from '@/domain/dtos/shared/pagination.dto';

describe('PaginationDto', () => {
  describe('constructor', () => {
    it('should create a valid PaginationDto', () => {
      // Arrange & Act
      const dto = new PaginationDto(10, 1, undefined);

      // Assert
      expect(dto.itemsPerPage).toBe(10);
      expect(dto.page).toBe(1);
      expect(dto.sorting).toBeUndefined();
      expect(dto.search).toBeUndefined();
    });

    it('should create a PaginationDto with search', () => {
      // Arrange & Act
      const dto = new PaginationDto(20, 2, undefined, 'test search');

      // Assert
      expect(dto.itemsPerPage).toBe(20);
      expect(dto.page).toBe(2);
      expect(dto.search).toBe('test search');
    });

    it('should create a PaginationDto with sorting', () => {
      // Arrange
      const sorting = { key: 'name', order: 'DESC' as const };

      // Act
      const dto = new PaginationDto(10, 1, sorting);

      // Assert
      expect(dto.sorting).toEqual(sorting);
    });

    it('should create a PaginationDto with sorting ASC', () => {
      // Arrange
      const sorting = { key: 'id', order: 'ASC' as const };

      // Act
      const dto = new PaginationDto(10, 1, sorting);

      // Assert
      expect(dto.sorting).toEqual(sorting);
    });

    it('should fix invalid sorting order to ASC', () => {
      // Arrange
      const sorting = { key: 'name', order: 'INVALID' as any };

      // Act
      const dto = new PaginationDto(10, 1, sorting);

      // Assert
      expect(dto.sorting!.order).toBe('ASC');
      expect(dto.sorting!.key).toBe('name');
    });

    it('should handle null sorting', () => {
      // Arrange & Act
      const dto = new PaginationDto(10, 1, null);

      // Assert
      expect(dto.sorting).toBeNull();
    });

    it('should handle undefined sorting', () => {
      // Arrange & Act
      const dto = new PaginationDto(10, 1, undefined);

      // Assert
      expect(dto.sorting).toBeUndefined();
    });

    it('should handle null search', () => {
      // Arrange & Act
      const dto = new PaginationDto(10, 1, undefined, null);

      // Assert
      expect(dto.search).toBeNull();
    });

    it('should handle empty string search', () => {
      // Arrange & Act
      const dto = new PaginationDto(10, 1, undefined, '');

      // Assert
      expect(dto.search).toBe('');
    });

    it('should accept zero itemsPerPage', () => {
      // Arrange & Act
      const dto = new PaginationDto(0, 1, undefined);

      // Assert
      expect(dto.itemsPerPage).toBe(0);
    });

    it('should accept negative itemsPerPage', () => {
      // Arrange & Act
      const dto = new PaginationDto(-5, 1, undefined);

      // Assert
      expect(dto.itemsPerPage).toBe(-5);
    });

    it('should accept zero page', () => {
      // Arrange & Act
      const dto = new PaginationDto(10, 0, undefined);

      // Assert
      expect(dto.page).toBe(0);
    });

    it('should accept negative page', () => {
      // Arrange & Act
      const dto = new PaginationDto(10, -1, undefined);

      // Assert
      expect(dto.page).toBe(-1);
    });

    it('should handle large numbers', () => {
      // Arrange & Act
      const dto = new PaginationDto(999999, 999999, undefined);

      // Assert
      expect(dto.itemsPerPage).toBe(999999);
      expect(dto.page).toBe(999999);
    });
  });

  describe('create', () => {
    it('should create with default values', () => {
      // Arrange
      const data = {};

      // Act
      const [error, dto] = PaginationDto.create(data);

      // Assert
      expect(error).toBeUndefined();
      expect(dto).toBeDefined();
      expect(dto!.itemsPerPage).toBe(10);
      expect(dto!.page).toBe(1);
    });

    it('should create with provided values', () => {
      // Arrange
      const data = {
        itemsPerPage: 25,
        page: 3,
        sorting: { key: 'email', order: 'ASC' },
        search: 'test',
      };

      // Act
      const [error, dto] = PaginationDto.create(data);

      // Assert
      expect(error).toBeUndefined();
      expect(dto).toBeDefined();
      expect(dto!.itemsPerPage).toBe(25);
      expect(dto!.page).toBe(3);
      expect(dto!.search).toBe('test');
    });

    it('should override defaults with provided values', () => {
      // Arrange
      const data = {
        itemsPerPage: 50,
        page: 10,
      };

      // Act
      const [error, dto] = PaginationDto.create(data);

      // Assert
      expect(dto!.itemsPerPage).toBe(50);
      expect(dto!.page).toBe(10);
    });

    it('should handle missing itemsPerPage (use default 10)', () => {
      // Arrange
      const data = {
        page: 2,
      };

      // Act
      const [error, dto] = PaginationDto.create(data);

      // Assert
      expect(dto!.itemsPerPage).toBe(10);
    });

    it('should handle missing page (use default 1)', () => {
      // Arrange
      const data = {
        itemsPerPage: 20,
      };

      // Act
      const [error, dto] = PaginationDto.create(data);

      // Assert
      expect(dto!.page).toBe(1);
    });

    it('should handle itemsPerPage = 0 (use provided value)', () => {
      // Arrange
      const data = {
        itemsPerPage: 0,
        page: 1,
      };

      // Act
      const [error, dto] = PaginationDto.create(data);

      // Assert
      expect(dto!.itemsPerPage).toBe(0);
    });

    it('should handle page = 0 (use provided value)', () => {
      // Arrange
      const data = {
        itemsPerPage: 10,
        page: 0,
      };

      // Act
      const [error, dto] = PaginationDto.create(data);

      // Assert
      expect(dto!.page).toBe(0);
    });

    it('should preserve invalid sorting order and fix in constructor', () => {
      // Arrange
      const data = {
        sorting: { key: 'status', order: 'INVALID' },
      };

      // Act
      const [error, dto] = PaginationDto.create(data);

      // Assert
      expect(dto!.sorting!.order).toBe('ASC');
    });

    it('should include search parameter', () => {
      // Arrange
      const data = {
        search: 'query123',
      };

      // Act
      const [error, dto] = PaginationDto.create(data);

      // Assert
      expect(dto!.search).toBe('query123');
    });

    it('should handle null search', () => {
      // Arrange
      const data = {
        search: null,
      };

      // Act
      const [error, dto] = PaginationDto.create(data);

      // Assert
      expect(dto!.search).toBeNull();
    });

    it('should return undefined error on success', () => {
      // Arrange
      const data = { itemsPerPage: 10, page: 1 };

      // Act
      const [error, dto] = PaginationDto.create(data);

      // Assert
      expect(error).toBeUndefined();
      expect(dto).toBeDefined();
    });
  });

  describe('getPaginationParams', () => {
    it('should return correct limit and offset for valid page 1', () => {
      // Arrange
      const dto = new PaginationDto(10, 1, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.limit).toBe(10);
      expect(params.offset).toBe(0);
    });

    it('should return correct limit and offset for page 2', () => {
      // Arrange
      const dto = new PaginationDto(10, 2, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.limit).toBe(10);
      expect(params.offset).toBe(10);
    });

    it('should return correct limit and offset for page 3', () => {
      // Arrange
      const dto = new PaginationDto(20, 3, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.limit).toBe(20);
      expect(params.offset).toBe(40);
    });

    it('should handle invalid itemsPerPage (NaN) and use default 10', () => {
      // Arrange
      const dto = new PaginationDto(NaN, 1, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.limit).toBe(10);
      expect(params.offset).toBe(0);
    });

    it('should handle negative itemsPerPage and use default 10', () => {
      // Arrange
      const dto = new PaginationDto(-5, 1, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.limit).toBe(10);
    });

    it('should handle zero itemsPerPage and use default 10', () => {
      // Arrange
      const dto = new PaginationDto(0, 1, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.limit).toBe(10);
    });

    it('should handle invalid page (NaN) and use default offset 0', () => {
      // Arrange
      const dto = new PaginationDto(10, NaN, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.offset).toBe(0);
      expect(params.limit).toBe(10);
    });

    it('should handle negative page and use default offset 0', () => {
      // Arrange
      const dto = new PaginationDto(10, -1, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.offset).toBe(0);
      expect(params.limit).toBe(10);
    });

    it('should handle zero page and use default offset 0', () => {
      // Arrange
      const dto = new PaginationDto(10, 0, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.offset).toBe(0);
      expect(params.limit).toBe(10);
    });

    it('should calculate offset correctly for large page numbers', () => {
      // Arrange
      const dto = new PaginationDto(50, 100, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.limit).toBe(50);
      expect(params.offset).toBe(4950); // (100 - 1) * 50
    });

    it('should handle both page and itemsPerPage as NaN', () => {
      // Arrange
      const dto = new PaginationDto(NaN, NaN, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.limit).toBe(10);
      expect(params.offset).toBe(0);
    });

    it('should handle large itemsPerPage', () => {
      // Arrange
      const dto = new PaginationDto(1000000, 1, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.limit).toBe(1000000);
      expect(params.offset).toBe(0);
    });

    it('should handle large itemsPerPage with large page number', () => {
      // Arrange
      const dto = new PaginationDto(1000000, 2, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.limit).toBe(1000000);
      expect(params.offset).toBe(1000000);
    });

    it('should calculate correctly with itemsPerPage 1', () => {
      // Arrange
      const dto = new PaginationDto(1, 5, undefined);

      // Act
      const params = dto.getPaginationParams();

      // Assert
      expect(params.limit).toBe(1);
      expect(params.offset).toBe(4);
    });
  });

  describe('edge cases and integration', () => {
    it('should handle PaginationDto created via create with getPaginationParams', () => {
      // Arrange
      const data = {
        itemsPerPage: 15,
        page: 4,
      };

      // Act
      const [, dto] = PaginationDto.create(data);
      const params = dto!.getPaginationParams();

      // Assert
      expect(params.limit).toBe(15);
      expect(params.offset).toBe(45); // (4 - 1) * 15
    });

    it('should preserve sorting through create and getPaginationParams', () => {
      // Arrange
      const data = {
        sorting: { key: 'createdAt', order: 'DESC' },
        itemsPerPage: 20,
        page: 2,
      };

      // Act
      const [, dto] = PaginationDto.create(data);
      const params = dto!.getPaginationParams();

      // Assert
      expect(dto!.sorting!.key).toBe('createdAt');
      expect(dto!.sorting!.order).toBe('DESC');
      expect(params.limit).toBe(20);
      expect(params.offset).toBe(20);
    });

    it('should handle complex search terms', () => {
      // Arrange
      const complexSearch =
        'special@chars!#$%&*()_+-=[]{}|;:,.<>?/~`"\'\\';

      // Act
      const [, dto] = PaginationDto.create({
        search: complexSearch,
      });

      // Assert
      expect(dto!.search).toBe(complexSearch);
    });

    it('should handle very long search term', () => {
      // Arrange
      const longSearch = 'a'.repeat(1000);

      // Act
      const [, dto] = PaginationDto.create({
        search: longSearch,
      });

      // Assert
      expect(dto!.search).toBe(longSearch);
    });
  });
});
