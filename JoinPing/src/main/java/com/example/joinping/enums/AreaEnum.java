package com.example.joinping.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 话题类别枚举
 */
@Getter
@AllArgsConstructor
public enum AreaEnum {
    SciTech(1, "科技"),
    Social(2, "社科"),
    Finance(3, "财经"),
    Digital(4, "数码"),
    Health(5, "健康"),
    Entertain(6, "娱乐"),
    History(7, "历史"),
    Politics(8, "时政"),
    Edu(9, "教育"),
    Sports(10, "体育"),
    Nature(11, "自然"),
    Life(12, "生活"),
    Arts(13, "文艺"),
    Others(14, "其他");
    
    private final Integer id;
    private final String description;
    
    
    /**
     * 判断是否存在指定的value值
     *
     * @param value 要判断的值，为null时返回false
     * @return 如果存在该value则返回true，否则返回false
     */
    public static boolean containsValue(Integer value) {
        if (value == null) {
            return false;
        }
        
        for (AreaEnum area : AreaEnum.values()) {
            if (area.id.equals(value)) {
                return true;
            }
        }
        return false;
    }
    
}
