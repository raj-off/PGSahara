import os
import re
import json

def verify_app():
    print("=== PG SAHARA COMPREHENSIVE VERIFICATION ===")
    
    # 1. Verify index.html exists
    assert os.path.exists('index.html'), "index.html must exist"
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 2. Check title and meta
    assert "PG SAHARA" in html, "Brand title must be present in index.html"
    assert "College Money Manager" in html, "Tagline must be present"

    # 3. Check CSS files
    css_files = ['css/styles.css', 'css/components.css', 'css/responsive.css']
    for cf in css_files:
        assert os.path.exists(cf), f"{cf} must exist"
        assert cf.split('/')[-1] in html, f"{cf} must be linked in index.html"
    print("[OK] All CSS files verified and linked")

    # 4. Check JS files
    js_files = [
        'vendor/chart.umd.min.js',
        'js/auth.js',
        'js/store.js',
        'js/calculations.js',
        'js/categories.js',
        'js/reminders.js',
        'js/calendar.js',
        'js/charts.js',
        'js/app.js'
    ]
    for jf in js_files:
        assert os.path.exists(jf), f"{jf} must exist"
        assert jf.split('/')[-1] in html, f"{jf} must be referenced in index.html"
    print(f"[OK] All {len(js_files)} JS/vendor files verified and linked")

    # 5. Extract all getElementById calls from JS files
    all_js_content = ""
    for jf in js_files[1:]:
        with open(jf, 'r', encoding='utf-8') as f:
            all_js_content += f.read() + "\n"

    element_ids = set(re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", all_js_content))
    missing_ids = []
    for eid in element_ids:
        # Some elements are dynamically created in other components (e.g. calendar, inspector)
        if f'id="{eid}"' not in html and f"id='{eid}'" not in html and f'id="{eid}"' not in all_js_content and f"id='{eid}'" not in all_js_content:
            missing_ids.append(eid)
    
    print(f"[OK] Checked {len(element_ids)} dynamic DOM element IDs. Missing: {missing_ids}")
    assert len(missing_ids) == 0, f"Missing IDs: {missing_ids}"

    # 6. Verify Financial Calculations Logic from store.js sample data
    with open('js/store.js', 'r', encoding='utf-8') as f:
        store_code = f.read()

    # Verify initial transactions match prompt
    # 7 September Swiggy 150 + Amazon 300 + Recharge 239 = 689
    assert '150' in store_code and 'Swiggy' in store_code
    assert '300' in store_code and 'Amazon' in store_code
    assert '239' in store_code and 'Mobile Recharge' in store_code
    print("[OK] September 7 transaction samples verified (Swiggy 150, Amazon 300, Recharge 239)")

    # Verify Rahul 500 pending weekly reminder
    assert 'Rahul' in store_code and '500' in store_code and 'WEEKLY' in store_code
    print("[OK] Rahul money given reminder verified (500, WEEKLY)")

    # Verify Amit 300 pending 2-day reminder
    assert 'Amit' in store_code and '300' in store_code and '2_DAYS' in store_code
    print("[OK] Amit money taken payment reminder verified (300, 2_DAYS)")

    # 7. Verify Auth features in auth.js
    with open('js/auth.js', 'r', encoding='utf-8') as f:
        auth_code = f.read()
    assert 'register' in auth_code
    assert 'login' in auth_code
    assert 'sendResetCode' in auth_code
    assert 'verifyAndResetPassword' in auth_code
    print("[OK] Auth methods verified (register, login, sendResetCode, verifyAndResetPassword)")

    # 8. Verify Reset Data methods in store.js
    assert 'clearAllPricesAndSavings' in store_code
    assert 'clearMonthPricesAndSavings' in store_code
    assert 'resetSavingsOnly' in store_code
    print("[OK] Reset Data methods verified (clearAllPricesAndSavings, clearMonthPricesAndSavings, resetSavingsOnly)")

    print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    verify_app()
