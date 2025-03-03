export class PaginationDto {
    constructor(
        public itemsPerPage: number,
        public page: number,
        public sorting: Sorting | undefined | null,
        public search?: string | null
    ) {
        if (this.sorting && !['ASC', 'DESC'].includes(this.sorting.order)) {
            this.sorting.order = 'ASC';
        }
    }

    static create(object: { [key: string]: any }): [string?, PaginationDto?] {
        const {
            itemsPerPage = 10,
            page = 1,
            sorting,
            search
        } = object

        return [
            undefined,
            new PaginationDto(
                itemsPerPage,
                page,
                sorting,
                search
            )
        ]
    }

    /**
     * Calculates the limit and offset for pagination based on the current PaginationDto instance.
     * @returns An object containing the limit and offset values.
     */
    getPaginationParams(): { limit: number, offset: number } {
        const limit = isNaN(this.itemsPerPage) || this.itemsPerPage <= 0 ? 10 : this.itemsPerPage;
        const offset = isNaN(this.page) || this.page <= 0 ? 0 : (this.page - 1) * limit;
        return {limit, offset};
    }
}

interface Sorting {
    key: string,
    order: 'ASC' | 'DESC'
}