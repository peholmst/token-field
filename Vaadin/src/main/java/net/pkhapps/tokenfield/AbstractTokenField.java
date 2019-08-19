package net.pkhapps.tokenfield;

import com.vaadin.flow.component.AbstractField;
import com.vaadin.flow.component.Focusable;
import com.vaadin.flow.component.HasSize;
import com.vaadin.flow.component.ItemLabelGenerator;
import com.vaadin.flow.data.binder.HasItems;
import com.vaadin.flow.data.selection.MultiSelect;
import com.vaadin.flow.data.selection.MultiSelectionListener;
import com.vaadin.flow.dom.DomEvent;
import com.vaadin.flow.function.SerializableComparator;
import com.vaadin.flow.shared.Registration;
import elemental.json.Json;
import elemental.json.JsonArray;
import elemental.json.JsonValue;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * @param <C>
 * @param <V>
 */
public abstract class AbstractTokenField<C extends AbstractTokenField<C, V>, V> extends AbstractField<C, Set<V>>
        implements MultiSelect<C, V>, HasItems<V>, HasSize, Focusable<C> {

    private Map<String, V> items = Collections.emptyMap();
    private ItemLabelGenerator<V> itemLabelGenerator = Object::toString;
    private ItemIdGenerator<V> itemIdGenerator = Object::toString;
    private SerializableComparator<V> itemComparator = createDefaultItemComparator();

    /**
     *
     */
    public AbstractTokenField() {
        super(Collections.emptySet());
        registerElementValueChangeListener();
    }

    private SerializableComparator<V> createDefaultItemComparator() {
        return (o1, o2) -> Comparator.comparing(getItemLabelGenerator()).compare(o1, o2);
    }

    private void registerElementValueChangeListener() {
        getElement().addEventListener("value-array-changed", this::handleElementValueChange).addEventData("event.detail.value");
    }

    private void handleElementValueChange(DomEvent event) {
        JsonArray jsonValue = event.getEventData().getArray("event.detail.value");
        Set<V> value = new HashSet<>();
        for (int i = 0; i < jsonValue.length(); ++i) {
            V item = items.get(jsonValue.getString(i));
            if (item != null) {
                value.add(item);
            } else {
                // TODO Issue warning
            }
        }
        setModelValue(value, true);
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
        getElement().setPropertyJson("value", convertItemsToJson(newPresentationValue, this::createIdJson));
    }

    @Override
    public void updateSelection(Set<V> addedItems, Set<V> removedItems) {
        Set<V> value = new HashSet<>(getValue());
        value.addAll(addedItems);
        value.removeAll(removedItems);
        setValue(value);
    }

    @Override
    public Set<V> getSelectedItems() {
        return getValue();
    }

    @Override
    public Registration addSelectionListener(MultiSelectionListener<C, V> listener) {
        return null; // TODO Implement me
    }

    @Override
    public void setItems(Collection<V> items) {
        Objects.requireNonNull(items, "items must not be null");
        this.items = items.stream().collect(Collectors.toMap(getItemIdGenerator(), v -> v));
        getElement().setPropertyJson("tokens", convertItemsToJson(items, this::createIdJson));
        // TODO Labels
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

    /**
     *
     * @return
     */
    public String getLabel() {
        return getElement().getProperty("label", "");
    }

    /**
     *
     * @param label
     */
    public void setLabel(String label) {
        getElement().setProperty("label", label == null ? "" : label);
    }
}
