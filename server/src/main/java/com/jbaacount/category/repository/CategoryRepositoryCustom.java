package com.jbaacount.category.repository;

import com.jbaacount.category.dto.response.CategoryInfoForResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CategoryRepositoryCustom
{
    CategoryInfoForResponse getCategoryInfo(Long categoryId, Pageable pageable);

    Page<CategoryInfoForResponse> getAllCategoryInfo(Long boardId, Pageable pageable);
}