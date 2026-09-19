/**
 * PG SAHARA - Dynamic Category & Subcategory Management
 * Enables adding categories and subcategories dynamically from the UI (+ Add Later).
 */

class SaharaCategoryManager {
  constructor(store) {
    this.store = store;
  }

  getAllCategories() {
    return this.store.getCategories();
  }

  getCategoriesForType(type) {
    const cats = this.store.getCategories();
    const t = type.toUpperCase();
    if (t === 'RENT') {
      return { 'ROOM RENT': ['Room Rent', 'Maintenance', 'Security Deposit'] };
    }
    if (t === 'GIVEN') {
      return { 'MONEY GIVEN': ['Lent to Friend', 'Shared Bill', 'College Project Share', 'Other'] };
    }
    if (t === 'TAKEN') {
      return { 'MONEY TAKEN': ['Borrowed', 'Canteen Share', 'Split Bill', 'Other'] };
    }
    return cats[t] || { 'GENERAL': ['General'] };
  }

  populateCategorySelect(selectElement, type, selectedCategory = null) {
    selectElement.innerHTML = '';
    const catMap = this.getCategoriesForType(type);
    const catKeys = Object.keys(catMap);

    catKeys.forEach(catName => {
      const opt = document.createElement('option');
      opt.value = catName;
      opt.textContent = catName;
      if (selectedCategory && selectedCategory === catName) {
        opt.selected = true;
      }
      selectElement.appendChild(opt);
    });

    // Add "+ Add New Category" option
    const addOpt = document.createElement('option');
    addOpt.value = '__ADD_NEW_CATEGORY__';
    addOpt.textContent = '➕ Add New Category...';
    selectElement.appendChild(addOpt);
  }

  populateSubcategorySelect(selectElement, type, categoryName, selectedSubcategory = null) {
    selectElement.innerHTML = '';
    const catMap = this.getCategoriesForType(type);
    const subList = catMap[categoryName] || [];

    subList.forEach(subName => {
      const opt = document.createElement('option');
      opt.value = subName;
      opt.textContent = subName;
      if (selectedSubcategory && selectedSubcategory === subName) {
        opt.selected = true;
      }
      selectElement.appendChild(opt);
    });

    // Add "+ Add New Subcategory" option
    const addOpt = document.createElement('option');
    addOpt.value = '__ADD_NEW_SUBCATEGORY__';
    addOpt.textContent = '➕ Add New Option...';
    selectElement.appendChild(addOpt);
  }

  addNewCategoryPrompt(type, onSuccess) {
    const name = window.prompt(`Enter new category name for ${type}:`);
    if (name && name.trim()) {
      try {
        this.store.addCategory(type, name.trim());
        if (onSuccess) onSuccess(name.trim().toUpperCase());
      } catch (err) {
        alert(err.message);
      }
    }
  }

  addNewSubcategoryPrompt(type, categoryName, onSuccess) {
    const name = window.prompt(`Enter new item / subcategory for "${categoryName}":`);
    if (name && name.trim()) {
      try {
        this.store.addSubcategory(type, categoryName, name.trim());
        if (onSuccess) onSuccess(name.trim());
      } catch (err) {
        alert(err.message);
      }
    }
  }
}

window.saharaCategories = new SaharaCategoryManager(window.saharaStore);
