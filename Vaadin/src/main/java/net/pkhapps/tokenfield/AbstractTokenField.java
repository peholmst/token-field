package net.pkhapps.tokenfield;

import com.vaadin.flow.component.AbstractField;
import com.vaadin.flow.component.Focusable;
import com.vaadin.flow.component.HasSize;
import com.vaadin.flow.component.ItemLabelGenerator;
import com.vaadin.flow.data.binder.HasItems;
import com.vaadin.flow.data.selection.MultiSelect;
import com.vaadin.flow.data.selection.MultiSelectionListener;
import com.vaadin.flow.function.SerializableComparator;
import com.vaadin.flow.shared.Registration;
import elemental.json.Json;
import elemental.json.JsonArray;
import elemental.json.JsonValue;

import java.util.*;
import java.util.function.Function;

/**
 * @param <C>
 * @param <V>
 */
public abstract class AbstractTokenField<C extends AbstractTokenField<C, V>, V> extends AbstractField<C, Set<V>>
        implements MultiSelect<C, V>, HasItems<V>, HasSize, Focusable<C> {

    private ItemLabelGenerator<V> itemLabelGenerator = Object::toString;
    private ItemIdGenerator<V> itemIdGenerator = Object::toString;
    private SerializableComparator<V> itemComparator = createDefaultItemComparator();

    /**
     *
     */
    public AbstractTokenField() {
        super(Collections.emptySet());
    }

    private SerializableComparator<V> createDefaultItemComparator() {
        return (o1, o2) -> Comparator.comparing(getItemLabelGenerator()).compare(o1, o2);
    }

    /**
     * @return
     */
    public ItemLabelGenerator<V> getItemLabelGenerator() {
        return itemLabelGenerator;
    }

    /**
     * @param itemLabelGenerator
     */
    public void setItemLabelGenerator(ItemLabelGenerator<V> itemLabelGenerator) {
        this.itemLabelGenerator = itemLabelGenerator == null ? Object::toString : itemLabelGenerator;
    }

    /**
     * @return
     */
    public ItemIdGenerator<V> getItemIdGenerator() {
        return itemIdGenerator;
    }

    /**
     * @param itemIdGenerator
     */
    public void setItemIdGenerator(ItemIdGenerator<V> itemIdGenerator) {
        this.itemIdGenerator = itemIdGenerator == null ? Object::toString : itemIdGenerator;
    }

    /**
     * @return
     */
    public SerializableComparator<V> getItemComparator() {
        return itemComparator;
    }

    /**
     * @param itemComparator
     */
    public void setItemComparator(SerializableComparator<V> itemComparator) {
        this.itemComparator = itemComparator == null ? createDefaultItemComparator() : itemComparator;
    }

    private JsonValue convertItemsToJson(Collection<V> items, Function<V, JsonValue> converter) {
        List<V> sortedList = sortItems(items);
        JsonArray json = Json.createArray();
        for (int i = 0; i < sortedList.size(); ++i) {
            json.set(i, converter.apply(sortedList.get(i)));
        }
        return json;
    }

    private List<V> sortItems(Collection<V> items) {
        List<V> sortedList = new ArrayList<>(items);
        if (itemComparator != null) {
            sortedList.sort(itemComparator);
        }
        return sortedList;
    }

    @Override
    protected void setPresentationValue(Set<V> newPresentationValue) {

    }

    @Override
    public void updateSelection(Set<V> addedItems, Set<V> removedItems) {

    }

    @Override
    public Set<V> getSelectedItems() {
        return null;
    }

    @Override
    public Registration addSelectionListener(MultiSelectionListener<C, V> listener) {
        return null;
    }

    @Override
    public void setItems(Collection<V> items) {
        getElement().setPropertyJson("tokens", convertItemsToJson(items, this::createIdJson));
        // TODO Labels
        //getElement().callJsFunction("setLabels", convertItemsToJson(items, this::createLabelJson));
    }

    private JsonValue createIdJson(V item) {
        return Json.create(getItemIdGenerator().apply(item));
    }

    private JsonValue createLabelJson(V item) {
        JsonArray jsonArray = Json.createArray();
        jsonArray.set(0, getItemIdGenerator().apply(item));
        jsonArray.set(1, getItemLabelGenerator().apply(item));
        return jsonArray;
    }

    public String getLabel() {
        return getElement().getProperty("label", "");
    }

    public void setLabel(String label) {
        getElement().setProperty("label", label == null ? "" : label);
    }
}
